# 核心代码边界

本文约束业务代码的依赖方向、职责划分和跨边界协作。新增抽象应具有稳定语义，能够降低真实复杂度或隔离外部变化；禁止添加无用的薄辅助方法、防御性兜底分支以及含义宽泛的 `XxxResolver`。

## API 模块依赖

模块内的标准依赖关系如下：

```txt
http -> application -> domain
                 \----> ports
adapters ----------------> ports + domain
persistence -------------> ports + domain
module -> http + application + concrete adapters + persistence
domain -> module-local domain code only
```

跨模块依赖只能指向提供方公开的稳定边界：

```txt
consumer application/adapter -> provider contracts
consumer application/adapter -> provider application facade
consumer event listener ------> provider events
```

- `domain` 表达业务对象、状态转换、不变量与纯规则，不导入 NestJS、Kysely、HTTP 类型、第三方 SDK、环境变量或外部格式字段。
- `application` 表达完整用户或系统意图，负责权限、编排、事务和已知错误收口。它依赖本模块的 `domain`、`ports` 以及明确的应用级契约。
- `ports` 描述应用层所需能力，名称应体现业务语义，例如 `CharacterCardStore`、`CharacterCardCodec` 和 `CharacterAvatarService`。
- `adapters` 翻译外部格式或第三方契约；`persistence` 实现数据访问 port 并完成数据库行映射。
- `http` 负责协议解析、DTO 校验、认证上下文、响应投影和 application error 到 HTTP 的映射。
- `<module>.module.ts` 负责装配 use case 和 port 实现，不承载业务判断。

controller 不执行数据库查询或业务状态变更。use case 不接收 Nest request、response 或 Kysely row。业务模块之间不得调用对方的 persistence 实现。

项目采用实用的领域模型。聚合根、值对象和领域服务只在规则或一致性边界确实需要时引入，不为套用架构概念机械增加类型。domain 代码应能脱离 Nest、数据库和网络直接进行单元测试。

每个 use case 通常完成以下工作：接收边界层已经解析的 command，通过 port 加载业务对象，执行权限与存在性检查，调用领域规则并组织外部能力，在需要原子性时进入 Unit of Work，发布同步领域事件，最后把下层已知错误收口为稳定的 application error。

一个 store 围绕业务对象或一致性边界设计，无需按数据库表逐一建立 repository。persistence 负责分页、排序、查询条件、JSON 列序列化以及数据库行与模块内部对象之间的转换。

## 跨模块协作

跨模块调用采用三种形式：

1. 公开 contract：提供方在 `contracts` 中暴露窄接口与语义类型。
2. application facade：提供方 use case 作为同步应用能力注入，调用方只依赖公开命令、结果和稳定错误。
3. 领域事件：提供方在 `events` 暴露业务事实，消费方监听器放在自身 `application` 并通过自身 port 完成工作。

新增依赖时优先选择最窄的 contract。现有 use case 本身完整表达所需业务能力时，可以直接使用 application facade。调用外部 facade 的 adapter 负责把对方错误翻译为本模块 port error。

## 事务与同步事件

多个写操作需要共同成功或失败时，由 application use case 使用 `UnitOfWork.run()` 定义事务边界。`KyselyUnitOfWork` 通过 `AsyncLocalStorage` 让同一异步调用链中的 store 加入当前事务，嵌套调用复用已有事务。store 与 controller 不开启业务事务。

模块公开事件使用过去式业务事实命名，例如 `CharacterDeletedEvent`。当前 `DomainEventPublisher` 基于 Nest EventEmitter 的 `emitAsync`，属于提交前、事务内的同步通知：发布者等待监听器完成，监听器之间没有顺序保证，失败会传播并使共享数据库事务回滚。

事务内监听器只执行能够加入当前 Unit of Work 的数据库操作。外部 HTTP、文件写入等副作用无法随数据库事务回滚，采用这些操作前必须设计幂等、补偿或提交后投递语义。跨进程投递、持久化重试和最终一致性需要单独引入 outbox 或消息基础设施。

## 错误边界

错误逐层翻译：

```txt
DomainError / PortError / infrastructure error
  -> ApplicationError
  -> ApiFailure
  -> ApiErrorEnvelope
  -> Web ApiError + i18n message
```

`RolestaError` 使用稳定 `reason`、语义化 `params` 和仅用于日志的 `cause`。application mapper 只翻译已知错误，未知异常交给全局异常过滤器。HTTP mapper 决定 status、公共错误码和响应参数；数据库错误、SDK 原始响应、凭据、SQL、堆栈与内部路径不得进入响应体。

新增错误时同步检查 application mapper、HTTP mapper、OpenAPI 响应和 Web i18n 映射。

controller 读取 path、query、body、header 和上传文件，使用 DTO 与 validator 完成协议校验。缺少上传文件等纯协议问题可以直接拒绝，文件内容解析交给 codec 或文件模块。

## Web Feature 边界

推荐依赖方向：

```txt
app -> feature routes/components
feature components -> feature hooks/model/api + shared UI
feature hooks -> feature api/model + lib
feature api -> lib/api + generated schema
lib -> @rolesta/shared or external libraries
```

route 组件负责页面入口与 feature 组合，复杂交互进入 feature component 或 hook。API 调用通过 `openapi-fetch` 和 `requestApi` 完成并复用生成类型；查询、mutation、缓存更新与失效规则放在 feature hook 或紧邻使用场景的位置。表单模型与 API DTO 不一致时，在 `model` 中维护编辑器模型和双向转换。

普通 feature 不导入另一个 feature 的内部组件或 hook。`workspace` 和 `chats` 是组合 feature，可以使用其他功能明确提供的 manager 组件；组合层不得接触被组合 feature 的草稿状态、私有 hook 或内部 API。出现第二个跨 feature 消费者时，为提供方建立明确的公开入口并统一迁移调用方。

`apps/web/src/lib/api/client.ts` 统一处理 API base URL、认证与语言 header、envelope 校验及 `ApiError`。feature API 不重复这些逻辑。用户可见文本由 i18next 管理，组件不得向用户展示后端内部错误信息。

全局 provider 只承载覆盖整个应用生命周期的能力。草稿、编辑器会话和面板状态由最接近其生命周期的 feature provider 管理。二进制下载等生成 client 无法完整表达的场景可以直接使用 `fetch`，仍需复用现有认证与语言 header 方法。

## 数据与兼容格式

SQLite 是当前默认数据库。需要检索、过滤、排序或约束的数据使用普通列；兼容快照和无法稳定建模的外部扩展可以保留为 JSON 文本，核心业务字段仍需显式建模。

```txt
HTTP upload
  -> codec adapter validates and parses external format
  -> internal domain/application representation
  -> use case applies owner, identity, timestamps and permissions
  -> store persists normalized fields and compatibility snapshot
```

SillyTavern 的 `first_mes`、`creatorcomment`、`keysecondary`、PNG metadata 等外部字段只存在于兼容 adapter 及其测试。内部代码统一使用 Rolesta 领域语言。

## 命名与文件组织

- use case：`<verb>-<subject>.use-case.ts`，类名为 `<Verb><Subject>UseCase`。
- store port：`<subject>-store.ts`，接口名为 `<Subject>Store`。
- adapter 名称包含外部系统或格式，例如 `SillyTavernCharacterCardCodec`。
- persistence 名称包含技术实现，例如 `KyselyCharacterCardStore`。
- HTTP DTO 按 request/response 语义命名，不与 domain 类型共用类。
- domain event 使用过去式事实名称，文件后缀为 `.event.ts`。
- 测试与被测代码相邻并使用 `*.spec.ts`，端到端测试放应用的 `test` 或 `tests` 目录。

`model-profiles`、Web 的 `model-providers`、现有 TypeScript 标识和 HTTP 契约使用当前技术名称。面向用户的产品文案与新领域讨论统一使用“模型连接”；技术标识重命名需要单独规划兼容迁移。
