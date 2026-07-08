# DDD and Hexagonal Architecture Guidelines

本文档总结一种通用的 DDD bounded contexts + Hexagonal Architecture 代码组织方式。它不绑定具体业务、框架、数据库、云服务或运行时，适用于需要长期维护多个业务能力的后端服务。

## 目标

这套规范的目标是把业务规则、用例编排、外部系统、传输协议和运行时装配放在清晰边界内。代码阅读者应能从目录位置判断一段代码的职责、可依赖对象和变更影响范围。

核心原则：

- 业务真相归属于 bounded context。
- 外部输入输出通过 adapters 进入或离开系统。
- 用例依赖 ports 描述能力，具体实现由 composition root 装配。
- domain 保持业务语义，避免携带 HTTP、数据库、SDK、消息队列等技术细节。
- 文件命名表达当前位置内的具体责任，目录表达上下文、能力和层。

## Recommended Source Layout

```txt
src/
  contexts/       bounded contexts: domain, application, ports, owned adapters
  interfaces/     inbound adapters: HTTP, RPC, CLI, events, DTOs, auth, response framing
  app/            bootstrap, composition root, runtime assembly, lifecycle
  infrastructure/ shared concrete integrations and low-level external helpers
  platform/       source-neutral contracts, primitives, config, parsing helpers
```

项目可以调整目录名，但职责边界应保持稳定。

## Layer Responsibilities

### contexts

`contexts` 承载业务能力。每个 bounded context 拥有自己的领域语言、业务规则、应用用例、ports 和上下文内 adapters。

常见结构：

```txt
contexts/<context>/
  domain/        entities, value objects, policies, invariants, reducers, domain errors
  application/   use cases, orchestration, transactions, deterministic services
  ports/         capability contracts used across boundaries
  adapters/      context-owned adapters for external source contracts
  persistence/   context-owned persistence implementations when persistence is context-specific
  testing/       fakes, test builders, test-only adapters
```

`domain` 回答业务对象什么状态合法、操作如何改变状态、哪些组合被禁止。`application` 负责一次用例的流程编排，比如读取当前状态、调用 domain 规则、通过 port 保存、返回用例结果。

### interfaces

`interfaces` 是 inbound adapters。它处理请求进入系统时的协议细节，包括 HTTP/RPC/CLI/message consumer、DTO 解析、认证、权限前置校验、响应格式、错误响应、流式响应等。

`interfaces` 可以调用 context 暴露的 application service 或 port，但不创建数据库连接、第三方 SDK client、repository、消息队列 producer 或复杂运行时对象。

### app

`app` 是 composition root 和生命周期拥有者。它负责读取启动配置、构建具体 adapters、创建 application services、注册 inbound routes、启动和关闭运行时资源。

`app` 可以依赖 `contexts`、`interfaces`、`infrastructure`、`platform` 来接线，但不承载业务规则、DTO 解析、SQL、SDK 调用细节或用户可见响应格式。

### infrastructure

`infrastructure` 放可复用的具体技术集成，比如数据库连接池、加密、HTTP transport、对象存储 client、消息队列基础封装、第三方 SDK runtime factory。

如果某个 adapter 翻译的是特定 bounded context 的业务源契约，应优先放在该 context 的 `adapters/` 或 `persistence/` 下。只有跨多个 context 复用且没有业务语义的低层能力才放入 `infrastructure`。

### platform

`platform` 放 source-neutral 的通用契约和基础工具，比如配置结构、通用认证 principal、通用解析 helper、通用错误基类、时间/ID 等 primitives。

`platform` 可被广泛导入，因此必须保持无业务、无传输协议绑定、无数据库或 SDK 依赖。若一个类型需要业务名、数据库名、provider 名才能解释清楚，它通常不应放在 `platform`。

## Dependency Direction

推荐依赖方向：

```txt
interfaces -> context ports/application -> domain
app        -> interfaces + contexts + infrastructure + platform
context adapters/persistence -> infrastructure/platform as needed
domain     -> domain-local types/helpers only
platform   -> no app/interfaces/infrastructure/context implementations
```

规则：

- context 的 domain/application 不导入 `app` 或 `interfaces`。
- context 的 domain/application 不导入 concrete infrastructure adapters 或 provider SDK。
- 兄弟 context 之间不导入实现路径，协作通过对方公开的 `ports`。
- inbound adapters 不构造 concrete external clients。
- composition root 构建 concrete adapters，并绑定到 application services 或 route dependencies。
- platform 不导入业务 context、inbound adapter、composition root 或 concrete external adapter。

## Ports and Adapters

Port 是能力契约，属于需要表达该能力的 bounded context。它可以描述持久化、跨 context 查询、外部源读取、对象提交、事件发布等能力。

Adapter 是 port 的具体实现。实现可以使用数据库、第三方 SDK、文件系统、远程 HTTP、消息队列等技术。

典型传递方式：

```txt
app/composition
  new ConcreteStore(...)
  new UseCaseApplication(store)

interfaces
  route -> useCaseApplication.execute(...)

context/application
  constructor(private readonly store: StorePort)
  execute -> domain rules -> store.save(...)

context/domain
  pure business rules and state transitions
```

domain 通常不直接持有 port。若一个业务操作需要保存内容，application 先调用 domain 产生合法的新状态，再通过 port 保存。这样 domain 可以保持可测试、可复用、无外部副作用。

## Domain Rules

domain 适合放以下内容：

- 实体和值对象的结构与不变量。
- 创建、修改、移动、提交、撤销等业务操作的合法性判断。
- patch/reducer 逻辑和状态迁移。
- 领域错误码和错误参数。
- 面向业务语言的 schema、normalizer、policy。
- 不依赖外部系统的派生数据计算。

domain 不应放以下内容：

- HTTP status、response body、headers。
- ORM query、SQL、数据库事务 API。
- 第三方 SDK client。
- DTO projection 和 route request parsing。
- 启动配置读取。
- 多 context 的装配逻辑。

## Application Services

application service 负责把一个用例完整执行完。它可以读取 port、调用 domain、保存结果、触发 context 内事件、返回 application result。

常见职责：

- 权限上下文和业务输入的用例级校验。
- 加载当前 aggregate 或业务快照。
- 调用 domain policy/reducer。
- 检查并发版本、幂等条件、状态流转前置条件。
- 通过 port 保存。
- 把 domain result 组合成 use case result。

application service 不应处理传输协议响应，也不应知道请求来自 HTTP、RPC、CLI 或事件。

## Cross-Context Collaboration

跨 context 调用应通过明确 port 完成。调用方依赖被调用方公开的 capability contract，避免引用被调用方内部 application、domain implementation、persistence adapter。

示例：

```txt
contexts/order/application
  imports contexts/customer/ports/CustomerCreditPort

app/composition
  creates CustomerCreditAdapter
  injects it into OrderApplication
```

如果协作开始变得复杂，应先明确哪个 context 拥有业务真相。不要通过 shared utils、global service 或 platform 类型绕过上下文边界。

## Inbound Adapters

Inbound adapter 只做协议边界工作：

- 读取 path/query/body/header。
- 解析和校验 DTO。
- 解析认证信息。
- 调用 application service 或 route-facing port。
- 把结果投影成响应 DTO。
- 把错误转换成协议响应。

Inbound adapter 不应包含业务决策。例如“用户是否能提交订单”应在 application/domain 内表达；“缺少 Authorization header 返回 401”属于 inbound adapter。

## Error Handling

推荐把错误分为业务错误和边界表达。

domain/application 抛出稳定错误码和参数：

```txt
code: ORDER.REVISION_CONFLICT
params: { expectedRevision: 3, currentRevision: 5 }
```

interfaces 根据错误码查 catalog，决定：

- HTTP status 或其他协议状态。
- 本地化消息模板。
- 参数插值。
- 响应体结构。

推荐响应结构：

```json
{
  "success": false,
  "error": {
    "code": "ORDER.REVISION_CONFLICT",
    "message": "订单版本冲突，期望版本 3，当前版本 5",
    "params": {
      "expectedRevision": 3,
      "currentRevision": 5
    },
    "traceId": "..."
  }
}
```

domain 可以拥有错误码和参数类型，但用户可见文案、国际化、HTTP status 映射应由 inbound boundary 处理。未知异常统一映射为内部错误，避免泄露数据库、SDK、token、URL、SQL 或堆栈信息。

## Configuration

生产代码不应在任意位置直接读取环境变量。推荐由启动配置模块读取、校验并归一化配置，composition root 再把明确的 config slice 传给下游模块。

规则：

- 配置 schema 集中维护。
- domain 不读取配置。
- application 只接收用例需要的显式参数或 port。
- adapter 接收具体技术配置。
- 测试使用显式 test config 或 fakes。

## Naming Rules

目录提供上下文，文件名提供局部责任。

推荐：

```txt
src/contexts/order/application/placeOrder.ts
src/contexts/order/domain/orderPolicy.ts
src/contexts/order/ports/OrderStorePort.ts
src/contexts/order/persistence/adapters/postgres/store.ts
src/app/composition/order/dependencies.ts
src/interfaces/http/order/routes.ts
```

避免：

```txt
src/contexts/order/application/orderPlaceOrderApplicationService.ts
src/contexts/order/persistence/adapters/postgres/postgresOrderStoreRepository.ts
src/app/composition/order/orderDomainRuntimeCompositionRoot.ts
```

当短文件名在目录内变得含糊，优先增加能力目录，再选择更精确的名词。

## Testing Guidance

测试应跟随边界设计：

- domain：纯函数、规则、状态迁移、错误码和参数。
- application：使用 fake ports 验证用例编排和保存行为。
- adapters：验证数据库/SDK/HTTP 翻译是否符合 port contract。
- interfaces：验证请求解析、认证、响应 DTO、错误映射。
- architecture guards：验证禁止依赖方向、禁止旧路径和禁止 SDK 泄漏。

测试用 fake 应显式放在 context 的 `testing/` 或测试目录下。生产代码不提供隐式内存 fallback。

## Change Placement Checklist

新增或修改功能前，先回答：

- 业务真相属于哪个 bounded context？
- 这是 domain 规则、application 用例、port、adapter、inbound route、composition wiring，还是通用 platform primitive？
- 是否引入了外部系统或 SDK？如果有，具体实现放在哪个 adapter？
- 是否跨 context？如果有，是否通过 port 协作？
- 是否把 HTTP/DTO/配置/数据库细节带进了 domain 或 application？
- 是否需要新增错误码、错误参数和边界层映射？
- 是否需要 guard test 保护新的依赖规则？

## Common Anti-Patterns

- 把业务规则写在 route handler。
- 在 domain/application 内创建数据库 client 或 SDK client。
- 让一个 context 直接导入兄弟 context 的 application、domain implementation 或 persistence adapter。
- 把业务专用类型放到 platform。
- 在 app composition 中写业务判断。
- 用 shared utils 承载不断膨胀的业务规则。
- 为兼容旧内部路径创建长期 barrels。
- 为每个一行调用创建薄 helper 或无语义承载类。
- 用文件名重复完整目录语义。

## Review Checklist

代码审查时重点看：

- 每个改动是否落在拥有该责任的层。
- domain/application 是否保持对 app、interfaces、concrete infrastructure 和 SDK 的隔离。
- route 是否只处理 inbound concerns。
- composition root 是否只做接线和生命周期管理。
- port 是否表达能力契约，名称是否具有业务语义。
- adapter 是否只负责技术/外部契约到领域概念的翻译。
- 错误码、错误参数、本地化消息和协议状态是否分层清楚。
- 测试是否覆盖规则、用例编排、adapter contract 和错误映射。
