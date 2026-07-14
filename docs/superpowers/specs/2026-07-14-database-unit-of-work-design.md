# Database Unit of Work 设计

## 状态

已实施。

## 背景

Rolesta API 当前由 Application use case 编排业务流程，Kysely persistence 实现直接注入根 `Kysely<Database>`。Preset、Worldbook、文件元数据、API Key 和头像分配等 persistence 实现会在 store 方法内部开启事务，Application 层无法让多个 store 共享同一个事务范围。

首个明确场景是管理员初始化。`SetupAdminUseCase` 先保存用户，再保存会话；会话保存失败时，已经写入的管理员不会回滚。后续聊天等功能也会出现跨 store 的数据库一致性需求。

## 目标

- 由 Application 层明确数据库事务边界。
- 同一异步调用链内的所有 Kysely store 自动使用当前事务。
- Domain 和业务 port 不依赖 Kysely、事务对象或数据库类型。
- persistence 只执行查询，不负责决定业务事务范围。
- 支持嵌套调用加入现有事务。
- 保持事务时间短，不把文件处理、文件系统和远程调用放入数据库事务。

## 范围外事项

- 文件系统、对象存储和远程服务的分布式事务。
- savepoint 和独立嵌套事务。
- 自动重试、死锁重试和事务隔离级别配置。
- 基于版本字段的乐观锁。
- 数据库结构和迁移变更。

## Application 端口

新增 `apps/api/src/common/application/unit-of-work.ts`：

```ts
export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');

export interface UnitOfWork {
  run<TResult>(operation: () => Promise<TResult>): Promise<TResult>;
}
```

Application use case 只依赖该接口。接口不暴露 commit、rollback、Kysely transaction 或 repository 集合。回调正常完成时提交，回调抛出异常时回滚。

## Kysely 数据库上下文

新增 `apps/api/src/database/kysely-database-context.ts`。`KyselyDatabaseContext` 通过 `AsyncLocalStorage` 保存当前异步调用链的 `Transaction<Database>`，并向 persistence 提供当前查询执行对象。

```ts
export type KyselyQueryExecutor = Omit<
  Kysely<Database>,
  'transaction' | 'startTransaction' | 'connection' | 'destroy'
>;

@Injectable()
export class KyselyDatabaseContext {
  private readonly transactions =
    new AsyncLocalStorage<Transaction<Database>>();

  constructor(
    @Inject(KYSELY_DB)
    private readonly rootDatabase: Kysely<Database>,
  ) {}

  get database(): KyselyQueryExecutor {
    return this.transactions.getStore() ?? this.rootDatabase;
  }

  get hasTransaction(): boolean {
    return this.transactions.getStore() !== undefined;
  }

  withinTransaction<TResult>(
    transaction: Transaction<Database>,
    operation: () => Promise<TResult>,
  ): Promise<TResult> {
    return this.transactions.run(transaction, operation);
  }
}
```

`KyselyQueryExecutor` 从类型层面移除事务和生命周期方法。业务 persistence 无法通过上下文开启事务或销毁数据库。

事务外访问 `database` 时返回根 Kysely 实例；事务内返回当前 transaction。`AsyncLocalStorage` 为并发请求隔离上下文，不使用全局可变 transaction 字段。

## Kysely Unit of Work

新增 `apps/api/src/database/kysely-unit-of-work.ts`：

```ts
@Injectable()
export class KyselyUnitOfWork implements UnitOfWork {
  constructor(
    @Inject(KYSELY_DB)
    private readonly database: Kysely<Database>,
    private readonly context: KyselyDatabaseContext,
  ) {}

  run<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    if (this.context.hasTransaction) {
      return operation();
    }

    return this.database.transaction().execute((transaction) =>
      this.context.withinTransaction(transaction, operation),
    );
  }
}
```

嵌套 `run()` 使用 REQUIRED 传播语义，直接加入当前事务。设计不提供 savepoint。内层异常需要继续向外传播，使最外层 Kysely callback 执行回滚。

## Persistence 规则

所有 Kysely persistence 实现改为注入 `KyselyDatabaseContext`，查询统一通过 `context.database` 执行。现有 persistence 内的 `.transaction()` 全部移除。

根 `KYSELY_DB` 只允许以下组件直接使用：

- `databaseProvider`。
- `DatabaseLifecycle`。
- `KyselyDatabaseContext`。
- `KyselyUnitOfWork`。

store 方法继续负责数据库行与领域对象的转换、条件更新、影响行数检查和 port error 翻译。事务边界由 Application use case 决定。

## 事务边界

事务覆盖一个数据库业务一致性单元。单条 SQL 已具备语句级原子性，无需统一包裹 UnitOfWork。

### 管理员初始化

密码哈希、领域对象构造和 token 生成在事务外完成。以下数据库操作进入同一个事务：

1. 检查现有用户数量。
2. 清理过期会话。
3. 保存管理员用户。
4. 保存管理员会话。

会话保存失败时，用户保存与过期会话清理共同回滚。

### Preset 与 Worldbook

创建和导入用例在事务中保存主表及子表。更新用例的读取聚合、领域变更和保存聚合处于同一个事务范围。persistence 的 `save()` 和 `update()` 只执行相关 SQL。

### 头像分配

图片检查、转换和文件内容写入位于数据库事务外。头像分配事务只包含：

1. 读取当前头像引用。
2. 激活新文件资源。
3. 更新用户或角色头像引用。
4. 将旧资源标记为 orphaned。

### 文件资源

`CreateFileResourceUseCase` 只在 UnitOfWork 内创建 `file_resources` 和 `file_objects` 元数据，随后在事务外写入内容。内容写入失败时资源保持 pending，由现有清理任务回收。

清理任务需要访问文件内容存储，继续使用现有分阶段流程，不创建覆盖整个清理过程的数据库事务。

### API Key 与聊天默认资产

删除 API Key 时，清理 provider 引用和删除 key 处于同一个事务。更新聊天默认资产时，所有权检查和默认值更新处于同一个事务。

### 单语句写入

Logout 删除会话、单表 Character CRUD、单表 Model Provider CRUD，以及通过外键级联完成的单语句删除，不增加显式 UnitOfWork。

Login 中的过期会话清理属于维护操作。清理成功后会话创建失败不会产生无效业务状态，因此保留独立执行。

## 文件与数据库流程

头像上传的顺序保持为：

```text
检查并处理图片
  -> UnitOfWork：创建 pending 文件元数据
  -> 写入文件内容
  -> UnitOfWork：激活资源并更新头像引用
```

数据库事务不覆盖图片处理和文件内容写入，避免长时间持有 SQLite 事务。

## 错误传播

`KyselyUnitOfWork` 不捕获 callback 异常。domain、port 和 application error 原样抛出，Kysely 完成回滚后，由外层 `@UseCase(...)` 继续执行现有模块错误映射。

事务开启或提交失败时，Kysely 原始异常进入现有未知异常处理路径，由 HTTP 边界记录并返回内部错误。本次不增加通用 `UnitOfWorkError`，避免覆盖已有 port error 的 reason、params 和 cause。

## Nest 装配

`DatabaseModule` 注册并导出数据库上下文与 Application 端口：

```ts
providers: [
  databaseProvider,
  DatabaseLifecycle,
  KyselyDatabaseContext,
  KyselyUnitOfWork,
  {
    provide: UNIT_OF_WORK,
    useExisting: KyselyUnitOfWork,
  },
],
exports: [KyselyDatabaseContext, UNIT_OF_WORK],
```

业务模块在 use case factory 中注入 `UNIT_OF_WORK`。persistence 由 Nest 注入 `KyselyDatabaseContext`。业务模块不导入 `KyselyUnitOfWork` 或 `KYSELY_DB`。

## 测试

新增 Kysely UnitOfWork 集成测试，使用真实临时 SQLite 验证：

- callback 成功时提交。
- callback 抛错时回滚。
- 两个 store 的写入共享同一事务。
- 嵌套 `run()` 加入外层事务。
- 事务结束后 context 恢复根数据库实例。

现有 persistence 测试改为使用 `KyselyDatabaseContext` 构造 store。多表写入测试通过 UnitOfWork 调用 store，保持与生产环境相同的事务边界。

Application 单元测试使用立即执行 callback 的 fake UnitOfWork，继续通过 fake store 验证用例编排。回滚行为集中在 Kysely 集成测试中验证。

## 验收条件

- `apps/api/src` 中只有 `KyselyUnitOfWork` 调用 `.transaction()`。
- `KYSELY_DB` 的直接使用限制在 `database` 目录。
- Application、domain 和业务 ports 不导入 Kysely 类型。
- 现有 persistence、Application 和 E2E 测试通过。
- 新增测试证明跨 store 回滚和嵌套事务传播有效。
- 文件处理和远程调用不进入数据库事务。

## 并发说明

UnitOfWork 保证事务范围内的提交与回滚。读取后保存仍可能出现丢失更新；需要时应通过 `updated_at_ms` 或独立版本字段实现条件更新。本次改造不处理该并发控制问题。
