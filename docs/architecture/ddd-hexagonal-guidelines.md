# Rolesta API DDD 与六边形架构约定

本文档记录 Rolesta API 的分层约定。它服务于 `apps/api/src` 下的 Nest 后端代码，重点约束角色卡、预设、世界书、模型档案、认证等业务模块的放置位置和依赖方向。

## 目标

这份约定解决三个问题：

- 看到文件路径后，能判断这段代码负责什么。
- `domain` 和 `application` 不被 HTTP、数据库、SDK、文件格式细节拖进去。
- SillyTavern 兼容格式、Kysely 持久化、Nest controller、启动装配各自待在清楚的位置。

Rolesta 的业务真相属于业务模块。比如角色卡的字段、可见性、导入后的内部结构属于 `characters`；世界书条目的排序、触发字段和兼容扩展属于 `worldbooks`；预设的 prompt item 编排属于 `presets`；模型 provider、API key 和连接测试属于 `model-profiles`。

## 源码布局

API 代码以 `apps/api/src` 为根：

```txt
apps/api/src/
  auth/
  characters/
  presets/
  worldbooks/
  model-profiles/
  database/
  config/
  http/
  logging/
  openapi/
  app.module.ts
  main.ts
```

`auth`、`characters`、`presets`、`worldbooks`、`model-profiles` 是业务模块。`database`、`config`、`http`、`logging`、`openapi` 是运行时或协议支撑代码。

业务模块内部推荐使用下面的结构：

```txt
<module>/
  domain/        业务对象、值对象、纯规则、领域类型
  application/   用例编排、权限语义、调用 domain 与 ports
  ports/         store、codec、外部能力、跨模块能力契约
  adapters/      外部格式、第三方契约、文件格式、provider 契约翻译
  persistence/   Kysely/SQL/数据库表与业务对象的互转
  http/          controller、request DTO、response DTO、协议错误映射
  testing/       fake ports、test builders、测试专用适配器
  <module>.module.ts
```

## 依赖方向

推荐依赖关系：

```txt
http -> application -> domain
application -> ports
adapters -> ports + domain
persistence -> ports + domain
module -> http + application + ports + adapters + persistence + shared infrastructure
domain -> domain-local only
```

具体规则：

- `domain` 只依赖同模块内的领域类型和纯工具。
- `application` 可以依赖本模块的 `domain` 和 `ports`。
- `application` 不导入 `http`、`adapters`、`persistence`、`database`、Nest controller、Kysely、第三方 SDK。
- `http` 可以调用 use case，可以做 DTO 校验、认证信息读取、响应映射和错误映射。
- `adapters` 和 `persistence` 实现 port。它们可以碰外部格式、数据库、远程接口、文件结构。
- `<module>.module.ts` 承担 Nest 下的装配工作，可以把具体实现注入 use case。
- 业务模块之间不要直接导入对方的 `domain`、`application`、`persistence` 实现。确实需要协作时，通过明确的 port 或更上层的用例编排处理。

## domain

`domain` 放内部业务概念。这里的代码要能在普通单元测试里直接运行，不需要 Nest、不需要数据库。

适合放在 `domain`：

- 角色卡、预设、世界书、模型档案等业务对象类型。
- 可见性、条目角色、插入位置、选择逻辑等领域枚举。
- 创建草稿、应用字段变更、排序规则、token 计数后的内部状态更新。
- 不依赖外部系统的派生数据计算。

不放在 `domain`：

- HTTP status、controller、request DTO、response DTO。
- Kysely、SQL、数据库表名、迁移字段。
- SillyTavern 原始字段名解析，比如 `first_mes`、`creatorcomment`、`keysecondary`。
- OpenAI 兼容接口请求细节、fetch、SDK client。
- `.env` 读取和 Nest provider 装配。

如果一个类型只有放在某个业务语境里才说得清楚，就优先放在该模块的 `domain`。如果多个模块都在复用，先判断它有没有业务含义。带业务语义的类型归属业务模块；无业务语义的基础能力归属共享运行时支撑代码。

## application

`application` 放一次用例的执行流程。用例通常做这些事：

- 接收已经过边界层解析的命令对象。
- 加载当前业务对象或列表。
- 做用例级权限判断，例如 owner 才能修改、公开资产可读取。
- 调用 domain 规则得到新状态。
- 调用 port 保存、查询、导入、导出或访问外部能力。
- 接住 domain/port 错误，并翻译成稳定的 application error reason。

以角色卡导入为例，`ImportCharacterCardUseCase` 负责生成 ID、设置 owner、写入创建时间、保存角色卡。文件是 JSON 还是 PNG、SillyTavern 字段怎么解析，由 `CharacterCardCodec` 的具体实现处理。

以模型 provider 连接测试为例，use case 可以依赖 `ChatCompletionConnectionClient` port。HTTP 请求怎么发、远端响应怎么解析，留给 infrastructure adapter。

## ports

`ports` 描述模块需要的能力。它只定义接口、命令类型、常量 token，不提供具体实现。

常用 port 类型：

- `CharacterCardStore`：角色卡持久化能力。
- `CharacterCardCodec`：角色卡兼容格式导入导出能力。
- `PresetStore`、`WorldbookStore`、`ModelProviderStore`：各模块持久化能力。
- `ChatCompletionConnectionClient`：模型连接和模型列表读取能力。

命名要表达业务能力。`Store` 适合表示聚合或业务对象的持久化。`Codec` 适合表示内外部格式互转。避免用 `XxxResolver` 这类含义松散的名字。

## adapters

`adapters` 放带业务含义的外部格式或外部契约翻译。

Rolesta 里最典型的是 SillyTavern 兼容：

```txt
characters/adapters/silly-tavern/
  silly-tavern-character-card-codec.ts
  silly-tavern-png-metadata-reader.ts

presets/adapters/silly-tavern/
worldbooks/adapters/silly-tavern/
```

这些代码可以知道外部字段名和兼容细节，例如：

- 角色卡：`first_mes`、`creatorcomment`、PNG `chara` metadata。
- 世界书：`entries`、`keysecondary`、`selectiveLogic`、extension 字段。
- 预设：SillyTavern preset prompt item 和模型参数字段。

adapter 的职责是把外部格式翻译成模块内部对象，或把内部对象导出成兼容格式。它可以抛出该模块的 port error，例如 `invalid-import-file`、`invalid-character-card`、`remote-unreachable`。

## persistence

`persistence` 放数据库实现。API 使用 Kysely，具体 store 实现应放在这里：

```txt
characters/persistence/kysely-character-card-store.ts
presets/persistence/kysely-preset-store.ts
worldbooks/persistence/kysely-worldbook-store.ts
model-profiles/persistence/kysely-model-provider-store.ts
```

这里可以依赖：

- `@rolesta/db` 的表类型。
- `Kysely`、`Selectable`、`Insertable`。
- `database.provider.ts` 暴露的数据库 token。
- 本模块的 `domain` 类型和 `ports` 接口。

这里负责数据库行和业务对象之间的转换。SQL 字段名、JSON 列序列化、分页查询、排序字段映射都属于 persistence。

## http

`http` 是入站适配层。它接收 HTTP 请求，然后调用 use case。

适合放在 `http`：

- Nest controller。
- request DTO 和 class-validator 装饰器。
- response DTO 和 domain/application result 到响应体的投影。
- application error 到 `ApiFailure` 的映射。
- 文件上传字段检查、query/path/body/header 读取。

不适合放在 `http`：

- 角色卡、世界书、预设的业务状态变更。
- 数据库查询。
- 第三方 API client。
- SillyTavern 字段解析。

controller 可以做协议层判断，例如没有上传文件时抛出 `invalid-import-file`。更深的文件内容解析交给 codec adapter。

## module 与装配

`<module>.module.ts` 在 Nest 项目里就是模块级 composition root。它可以 import 具体 adapter 和 persistence 实现，再把它们绑定到 port token。

角色卡模块的接线方式：

```txt
CHARACTER_CARD_STORE -> KyselyCharacterCardStore
CHARACTER_CARD_CODEC -> SillyTavernCharacterCardCodec
ImportCharacterCardUseCase(store, codec, idGenerator, clock)
ExportCharacterCardUseCase(store, codec)
```

module 可以依赖具体类，但只做接线和生命周期注册。业务判断不要写在 module 里。

## 错误模型

Rolesta API 的异常按层分开管理，但共用同一个基础形状。

### 基类

`apps/api/src/common/errors` 放公共错误基类 `RolestaError`。它只负责：

- `reason`：模块内稳定的枚举值。
- `params`：语义参数，字段名必须能直接说明业务含义。
- `cause`：底层原始异常，只用于日志和排障。

`message` 不承载用户可见文案。对外文案由 HTTP 层翻成 i18n key。

### 分层

- `DomainError`：领域规则失败，只在 domain 和 application 之间流动。
- `PortError`：外部能力失败，只在 ports、adapter、persistence 和 application 之间流动。
- `ApplicationError`：应用层稳定错误，由 application 统一收口后向上抛出。
- `ApiFailure`：HTTP 协议异常，只在 `http` 层对外输出。

### 映射

application 层负责接住下层错误，并翻成本模块的 `ApplicationError`。HTTP 层负责把 `ApplicationError` 映射成：

- HTTP status。
- `ApiFailure` code。
- `msg` 使用 `i18n:<key>`。
- i18n message key。
- 响应 envelope 的 `data`。

controller 可以做协议层判断，例如没有上传文件时抛出模块自己的 `ApplicationError`。更深的文件内容解析交给 codec adapter。数据库异常、SDK 异常、token、URL、SQL 和堆栈不要透出到响应体。

`UseCase` 的 `execute()` 方法建议通过共享的方法级 decorator 包住，decorator 负责调用模块内 mapper，把 `DomainError`、`PortError` 翻成该模块的 `ApplicationError`。这样每个 use case 仍然只暴露一个入口，错误收口也集中在 application 边界。

### 错误日志

错误日志集中在边界层打印一次。预期业务失败使用 `warn` 或 `info`，未知异常使用 `error`。日志至少保留 `reason`、`params`、请求方法、路径和 `cause`。

## 配置

生产代码不要在业务模块里随手读 `process.env`。配置由 `config` 模块读取、校验、归一化，再通过 Nest module 或 adapter 构造参数传下去。

规则：

- `domain` 不读取配置。
- `application` 接收明确参数或 port。
- adapter 接收它需要的配置切片。
- 测试使用 fake、fixture 或显式 test config。

## 命名

文件名表达当前位置内的具体责任。目录已经提供上下文，文件名不用重复整条路径。

推荐：

```txt
characters/application/import-character-card.use-case.ts
characters/ports/character-card-codec.ts
characters/adapters/silly-tavern/silly-tavern-character-card-codec.ts
characters/persistence/kysely-character-card-store.ts
characters/http/characters.controller.ts
```

避免：

```txt
characters/application/characterCardImportCharacterCardApplicationService.ts
characters/infrastructure/postgresCharacterCardStoreRepository.ts
characters/application/characterCardSillyTavernImportResolver.ts
```

当文件名变得含糊，优先增加一层能力目录，再选择更精确的名词。

## 测试

测试跟随边界写：

- `domain`：纯规则、状态迁移、字段合法性。
- `application`：使用 fake ports 验证用例编排、权限判断、保存行为。
- `adapters`：验证外部格式或远端契约翻译，例如 SillyTavern JSON/PNG。
- `persistence`：验证 Kysely store 是否满足 port 语义。
- `http`：验证请求解析、认证、响应 DTO、错误映射。

生产代码不要提供隐式内存 store。测试里的 fake 放在测试文件或 `testing/` 下。

## 新增或修改功能时怎么放

改代码前先判断：

- 业务真相属于哪个模块：`characters`、`presets`、`worldbooks`、`model-profiles`、`auth`，还是共享运行时支撑？
- 这是业务规则、用例流程、port、adapter、persistence、HTTP 边界，还是 module 接线？
- 是否引入外部格式、数据库、远端 HTTP 或 SDK？具体实现应落到 adapter 或 persistence。
- 是否跨模块？如果跨模块，调用方能否通过 port 表达需要的能力？
- 是否把 DTO、HTTP、配置、数据库字段带进了 `domain` 或 `application`？
- 是否需要补 application error reason 和 HTTP 映射？
- 是否需要加测试保护新的边界？

## 常见问题

- 把 SillyTavern 字段解析写进 use case。
- 在 application 里直接导入 `kysely-*store`。
- 在 controller 里写 owner 判断、条目排序、prompt item 校验。
- 让某个业务模块里的基础工具被其他模块长期复用。
- 把业务专用类型放进共享 `packages/shared`。
- 为一行调用新建薄 helper 或无语义承载类。
- 为旧路径创建长期 barrel，让依赖方向继续模糊。

## 代码审查重点

审查 Rolesta API 的业务改动时，重点看这些点：

- 文件是否放在拥有该职责的目录。
- `domain/application` 是否避开 HTTP、Kysely、SDK、具体 adapter。
- controller 是否只处理 HTTP 边界。
- module 是否只接线。
- port 名称是否表达真实业务能力。
- adapter 是否只负责外部契约和内部对象的翻译。
- persistence 是否把数据库细节关在 store 实现里。
- 错误 reason、HTTP status、i18n message 是否分层清楚。
- 测试是否覆盖 domain 规则、application 编排、adapter 翻译和 persistence 语义。
