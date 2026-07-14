# 同步领域事件设计

## 状态

已确认，待实施。

## 背景

Rolesta API 按业务模块组织 Domain、Application、Ports、Persistence 与 HTTP 边界。部分跨领域一致性目前落在 persistence：角色头像分配实现同时更新 `characters` 与 `file_resources`，聊天资产默认值依赖跨领域外键在资产删除时执行 `ON DELETE SET NULL`。这些实现让一个模块的 persistence 知道另一个模块的表与生命周期规则。

项目已经提供基于 `AsyncLocalStorage` 的 `UnitOfWork`。同一事务 callback 内调用的 Kysely store 会共享当前 transaction，因此可以在 Application 层发布同步事件，并让不同模块的 Listener 加入发布方事务。

首期事件由 Application 用例显式创建和发布。领域聚合记录事件的能力留待后续设计。

## 目标

- 使用 NestJS 同步事件机制触发跨领域业务。
- 发布方写入与全部 Listener 的数据库写入共享同一 `UnitOfWork`。
- 任一 Listener 失败时让发布方事务回滚。
- `common` 提供统一 Publisher，业务代码不直接依赖 `EventEmitter2`。
- Listener 直接使用 `@nestjs/event-emitter` 的原生 `@OnEvent`。
- 支持一个事件对应多个 Listener 和 Listener 内嵌套发布事件。
- 用事件解除角色头像 persistence 对文件资源表的直接写入。
- 用事件接管资产删除后的聊天默认值清理，并移除对应跨领域外键。

## 范围外事项

- 聚合根收集和延迟发布领域事件。
- 聊天偏好所有权查询端口改造。
- 异步消息、Outbox、重试和跨进程投递。
- Listener 幂等键、事件持久化和事件版本化。
- Listener 优先级和执行顺序保证。
- 批量发布 API。
- 网络、文件系统或其他不可回滚副作用的事件处理。

## 技术选型

采用 `@nestjs/event-emitter`，由 `common/events` 封装 `DomainEventPublisher`。Publisher 调用并等待 `EventEmitter2.emitAsync()`，业务 Listener 使用原生 `@OnEvent` 注册。

不采用 `@nestjs/cqrs`。其默认 `EventBus` 通过 RxJS Subject 发布，处理器经 `mergeMap` 独立执行，`publish()` 无法等待全部异步处理器完成。替换 CQRS Publisher 也无法改变订阅侧的等待方式。

不新增项目级 Listener 接口或 Listener 装饰器。Listener 的类和方法组织由消费模块决定。

## 公共事件契约

`apps/api/src/common/events` 提供以下公共能力：

```ts
export interface DomainEvent<TType extends string = string> {
  readonly type: TType;
  readonly occurredAtMs: number;
}

export class DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export class DomainEventHandlingError extends Error {
  readonly eventType: string;
  override readonly cause: unknown;
}
```

每种事件在生产模块的 `<module>/events` 目录中定义，并导出稳定的字符串事件名。事件实例使用只读字段，只携带 ID、时间、枚举和可空标量，不携带领域实体、Store、数据库对象或 Nest provider。

`<module>/events` 是生产模块面向其他业务模块公开的事件契约。消费模块可以依赖该目录中的事件名与载荷类型，不得借此导入生产模块的 domain、application 或 persistence 实现。

事件名采用 `<module>.<fact>` 形式并表达已经发生的事实，例如：

- `characters.avatar-changed`
- `characters.character-deleted`
- `presets.preset-deleted`
- `model-profiles.model-provider-deleted`

首期不增加事件 ID。同步进程内发布没有去重、重放和持久化需求。

## Publisher

`DomainEventsModule` 包装 `EventEmitterModule.forRoot()`，提供并导出 `DomainEventPublisher`。需要发布事件的业务模块显式导入 `DomainEventsModule`，Application use case 只依赖 Publisher。

`DomainEventPublisher.publish()` 执行以下步骤：

1. 调用并等待 `eventEmitter.emitAsync(event.type, event)`。
2. 发布成功时返回 `void`。
3. 捕获同步异常或 Promise 拒绝，包装为 `DomainEventHandlingError`。
4. 错误中保留 `eventType` 和 `cause`，不保存或记录完整事件载荷。

没有 Listener 时 `emitAsync()` 返回空结果，Publisher 正常完成。Listener 中再次调用并等待 Publisher 时，新事件立即发布；嵌套发布完成后当前 Listener 继续执行。

Publisher 不开启 `UnitOfWork`。Publisher 无法把发布前已经完成的业务写入重新纳入事务，因此事务边界必须覆盖状态变更和事件发布：

```ts
await unitOfWork.run(async () => {
  await store.changeState();
  await domainEvents.publish(event);
});
```

## Listener 约定

Listener 是普通 Nest provider，直接使用原生装饰器：

```ts
@OnEvent(CHARACTER_AVATAR_CHANGED, { suppressErrors: false })
async onCharacterAvatarChanged(event: CharacterAvatarChangedEvent) {
  // 消费模块的应用编排
}
```

所有事务 Listener 必须设置 `suppressErrors: false`。`@nestjs/event-emitter` 默认会记录并吞掉 Listener 异常，这会让 Publisher 误判发布成功并提交事务。

同一事件可以注册多个 Listener。执行顺序不构成业务契约，Listener 之间不得依赖先后关系。每个 Listener 只修改自身模块拥有的数据。

`emitAsync()` 会先调用全部 Listener，再通过 `Promise.all()` 等待结果，因此多个 Listener 会并发运行。全部 Listener 成功后 Publisher 才返回，所有数据库操作通过 `AsyncLocalStorage` 取得发布方 transaction。任一 Listener 拒绝时 Publisher 进入失败路径并触发事务回滚；其他已经启动的 Listener 不会被取消，可能继续运行到各自结束。事务 Listener 因此不得执行网络、文件系统、消息发送等不可回滚副作用。

## 错误处理

Publisher 不记录日志。`DomainEventHandlingError` 沿用例调用栈传播，现有 HTTP 错误边界集中记录一次。嵌套发布失败时，每层 Publisher 都可以包装其事件类型，cause 链保留事件传播路径。

发布用例可以按业务需要将 `DomainEventHandlingError` 翻译为本模块稳定的 `ApplicationError`。首期头像变更可映射为头像分配冲突；资产删除事件处理失败暂时进入全局内部错误路径。Publisher 不导入角色、文件或聊天偏好模块的错误类型。

## 角色头像事件

新增 `CharacterAvatarChangedEvent`，载荷包括：

- `characterId`
- `ownerUserId`
- `previousResourceId`
- `currentResourceId`
- `occurredAtMs`

`previousResourceId` 与 `currentResourceId` 均允许为 `null`。头像上传、更换和移除共用该事件。

头像上传继续按以下顺序执行：

```text
事务外：检查与处理图片
  -> 事务外：创建 pending 文件元数据
  -> 事务外：写入文件内容
  -> UnitOfWork：更新角色头像引用
  -> UnitOfWork：发布 CharacterAvatarChangedEvent
  -> 文件 Listener：激活新资源并 orphan 旧资源
```

`KyselyCharacterAvatarAssignment` 只读取和更新 `characters`，不再查询或更新 `file_resources`。它返回更新后的角色以及发布事件所需的旧、新资源 ID。角色头像对 `file_resources` 的存在性外键继续保留，文件资源状态、purpose 和 owner 规则由文件模块 Listener 负责。

头像移除先把角色引用更新为 `null`，再发布 `CharacterAvatarChangedEvent`。文件 Listener 将旧资源标记为 orphaned。角色原本没有头像时不发布事件。

文件 Listener 处理失败时，角色引用更新随事务回滚。头像上传流程在事务外创建的新文件资源保持 pending，由现有清理任务回收。

## 资产删除事件

新增以下事件：

- `CharacterDeletedEvent`
- `PresetDeletedEvent`
- `ModelProviderDeletedEvent`

每个事件携带被删除资产 ID、`ownerUserId` 和 `occurredAtMs`。`CharacterDeletedEvent` 额外携带删除前的 `avatarResourceId`，允许文件模块回收角色头像。

删除用例必须在同一 `UnitOfWork` 中完成删除和发布：

```text
加载或确认本人资产
  -> UnitOfWork：删除资产
  -> UnitOfWork：发布对应 DeletedEvent
  -> chat-preferences Listener：清空匹配的默认引用
```

消费删除事件时，`chat-preferences` 只更新自己拥有的 `asset_defaults`。没有偏好记录或对应字段未引用该资产时，更新幂等完成。

删除带头像的角色时，`CharacterDeletedEvent` 同时由文件模块消费。文件 Listener 将 `avatarResourceId` 标记为 orphaned；聊天偏好 Listener 清空默认 Persona。两个 Listener 不依赖执行顺序。

## 数据库迁移

新增迁移重建 SQLite `asset_defaults` 表：

- 保留现有数据。
- 保留 `user_id -> users.id` 外键和用户删除级联行为。
- 移除 `persona_character_id -> characters.id` 外键。
- 移除 `preset_id -> presets.id` 外键。
- 移除 `model_provider_id -> model_provider_configs.id` 外键。
- 保持三个默认值字段可空。

资产删除后的引用清理由同步事件负责。Publisher 对零 Listener 视为成功，因此 Nest 装配测试必须验证三个删除事件均存在有效的聊天偏好 Listener。

## Nest 模块装配

- 发布事件的 `CharactersModule`、`PresetsModule` 和 `ModelProfilesModule` 显式导入 `DomainEventsModule`，从中获得 `DomainEventPublisher`。
- `FilesModule` 注册角色头像变更与角色删除 Listener。
- `ChatPreferencesModule` 注册角色、预设和模型连接删除 Listener。
- 只消费事件且不嵌套发布的模块无需导入 `DomainEventsModule`。
- Listener 保持在消费模块的 application 边界，persistence 实现继续只处理本模块表。

原生 Listener 在 Nest application bootstrap 阶段完成发现和注册。使用完整 Nest 测试模块的测试必须调用 `app.init()` 后再发布事件。

## 测试

### Publisher 测试

使用真实 `EventEmitter2` 验证：

- 没有 Listener 时发布成功。
- 异步 Listener 完成后 Publisher 才成功返回。
- 多个 Listener 均会执行，不断言先后顺序。
- Listener 可以嵌套发布并等待新事件完成。
- Listener 拒绝时 Publisher 抛出 `DomainEventHandlingError`。
- 包装错误保留事件类型和原始 cause。

使用真实 Nest application context 验证 `@OnEvent(..., { suppressErrors: false })` 的异常能够传回 Publisher。

### 跨领域集成测试

使用真实临时 SQLite 与 Nest 装配验证：

- 头像更换成功后，角色引用、新资源 active 和旧资源 orphaned 一起提交。
- 文件资源处理失败后，角色引用回滚，新上传资源保持 pending。
- 头像移除后，角色引用清空且旧资源 orphaned。
- 删除带头像的角色后，角色删除、默认 Persona 清空和头像 orphaned 处于同一事务。
- 删除预设后默认预设置空。
- 删除模型连接后默认连接置空。
- 默认值不存在或没有引用被删除资产时，Listener 幂等完成。
- Nest 装配完成后，三个删除事件均能触发聊天偏好 Listener。

### 迁移测试

验证迁移前的默认值数据完整保留，三条资产外键已经移除，用户外键仍存在，删除用户仍会级联删除其聊天偏好。

## 验收条件

- Application use case 不直接注入或调用 `EventEmitter2`。
- Listener 直接使用原生 `@OnEvent`，所有事务 Listener 均配置 `suppressErrors: false`。
- 发布事件的状态变更和 `publish()` 位于同一 `UnitOfWork` callback。
- 角色 persistence 不再读写 `file_resources`。
- 文件 Listener 只修改文件模块拥有的数据。
- 聊天偏好 Listener 只修改 `asset_defaults`。
- `asset_defaults` 不再包含三条资产外键。
- 头像变更和资产删除的成功、回滚与幂等场景通过测试。
- Listener 中不存在文件系统、网络或其他事务外副作用。
