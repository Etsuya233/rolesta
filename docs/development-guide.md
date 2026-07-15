# Rolesta 项目开发指南

本文档是 Rolesta 的统一开发指南，描述当前项目架构、目录结构、代码组织方式和日常开发约定，适用于整个 monorepo。

文档以当前代码为准。目录里的空模块或产品规划不代表能力已经完成；新增代码应遵守本文的依赖边界，并在架构发生变化时同步更新本文。

## 1. 项目概览

Rolesta 是一个面向角色扮演聊天的个人工作台，核心业务围绕角色卡、Persona、世界书、预设、模型连接、聊天偏好和会话展开。外部兼容格式目前以 SillyTavern 为主。

项目采用 TypeScript monorepo：

```txt
rolesta/
  apps/
    api/                 NestJS API
    web/                 React Web 应用
  packages/
    config/              ESLint、Prettier、TypeScript 共享配置
    db/                  数据库 schema、迁移和方言
    shared/              跨应用协议类型与通用纯能力
  docs/                  架构、ADR、开发指南和阶段性设计文档
  package.json           根命令和工具版本
  pnpm-workspace.yaml    pnpm workspace 定义
  turbo.json             Turborepo 任务图
```

运行时的主要调用链如下：

```txt
Browser
  -> apps/web
  -> HTTP / OpenAPI contract
  -> apps/api/http
  -> apps/api/application
  -> domain + ports
  -> persistence / adapters
  -> packages/db + SQLite / external services
```

依赖应朝业务规则和稳定契约方向流动。数据库、HTTP、第三方 SDK 和外部文件格式都位于边界层，不能成为领域模型的依赖。

## 2. 技术栈与运行要求

- Node.js 24.18.0，由 mise 根据仓库根目录的 `mise.toml` 安装和切换。
- pnpm 11.9.0，由 Corepack 根据根 `package.json` 的 `packageManager` 字段提供。
- Turborepo 负责任务编排。
- API 使用 NestJS、Kysely、SQLite、class-validator 和 Swagger/OpenAPI。
- Web 使用 React、React Router、TanStack Query、openapi-fetch、i18next、Tailwind CSS 和 shadcn/ui。
- 单元测试与集成测试使用 Vitest，Web 端到端测试使用 Playwright。

首次启动：

```powershell
mise install
mise exec -- corepack enable
pnpm install --trust-lockfile
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
Copy-Item packages/db/.env.example packages/db/.env
pnpm --filter @rolesta/db build
pnpm db:migrate
pnpm dev
```

首次使用前需要安装 mise，并把 `(& mise activate pwsh) | Out-String | Invoke-Expression` 加入 PowerShell profile。Corepack 仅负责把 `pnpm` 命令映射到 `packageManager` 声明的版本；项目 scripts 直接调用 `pnpm`。

`pnpm db:migrate` 运行 `packages/db/dist/migrator.js`。全新检出或修改数据库包源码后，必须先构建 `@rolesta/db`。

默认地址：

- Web：`http://127.0.0.1:5173`
- API：`http://127.0.0.1:3000`
- API 文档：`http://127.0.0.1:3000/docs`

常用验证命令：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

只修改单个 workspace 时，优先使用过滤命令缩短反馈时间：

```powershell
pnpm --filter @rolesta/api test
pnpm --filter @rolesta/web typecheck
pnpm --filter @rolesta/db test
pnpm --filter @rolesta/shared test
```

## 3. Workspace 职责与依赖

### 3.1 `apps/api`

API 是业务用例的执行边界，负责认证、权限、领域规则编排、持久化协调、外部兼容格式转换和 HTTP 协议输出。

允许依赖：

- `@rolesta/db`：数据库类型、迁移基础能力和方言。
- `@rolesta/shared`：API envelope、稳定错误码、分页和时间等跨端契约。
- NestJS、Kysely 和具体基础设施库，但这些依赖必须留在对应外层。

### 3.2 `apps/web`

Web 是产品交互层，按功能组织页面、状态、表单和 API 调用。它消费 OpenAPI 生成类型，不能复制一套手写的后端响应模型。

允许依赖 `@rolesta/shared` 中的跨端契约。Web 不依赖 `@rolesta/db`，也不导入 API 源码。

### 3.3 `packages/db`

`@rolesta/db` 负责：

- Kysely 数据库 schema 类型。
- SQLite 方言创建与数据库配置。
- 按顺序执行的迁移。
- 数据库测试工具。

业务查询和业务对象映射留在 `apps/api/src/<module>/persistence`。schema 描述存储结构，不承载权限或领域行为。

新增或修改字段时应创建下一条迁移，同步更新 `src/schema`，并在 `src/migrations/index.ts` 导入、注册迁移。遗漏注册的迁移不会执行。已经进入共享环境的迁移不得通过改写历史文件来修正。

### 3.4 `packages/shared`

`@rolesta/shared` 只放真正需要跨应用复用的稳定契约或无业务归属的纯能力，例如：

- API 成功与错误 envelope。
- 稳定错误码和语言区域类型。
- 分页、时间和 prompt tokenizer 等纯函数。

角色卡、世界书、预设等领域对象归所属 API 模块。仅仅被两个文件使用，不能成为移动到 `shared` 的理由。

### 3.5 `packages/config`

`@rolesta/config` 提供 ESLint、Prettier 和 TypeScript 基础配置。它属于开发工具层，不参与产品运行时业务。

## 4. API 架构

### 4.1 顶层模块

`apps/api/src` 以业务能力和运行时支撑能力划分：

```txt
apps/api/src/
  auth/                 认证与初始管理员
  users/                用户及头像
  characters/           角色卡
  worldbooks/           世界书
  presets/              预设
  model-profiles/        模型连接，目录名为历史命名
  chat-preferences/      聊天偏好与资产默认值
  files/                文件资源与生命周期
  chats/                会话能力，当前仍在演进
  generation-debug/     生成调试能力，当前仍在演进
  common/               API 内部共享的应用契约、错误和事件设施
  database/             Kysely 连接、事务上下文和 Unit of Work 实现
  config/               配置加载、校验和归一化
  http/                 全局 HTTP envelope、filter、interceptor
  logging/              日志装配
  openapi/              OpenAPI 文档生成
  app.module.ts         应用级 composition root
  main.ts               进程入口
```

目录名 `model-profiles`、Web 的 `model-providers`、现有 TypeScript 标识和 HTTP 契约均属于存量技术命名。面向用户的产品文案和新领域讨论统一使用“模型连接”。修改存量技术标识需要单独规划兼容迁移，本指南不要求在日常功能改动中顺带重命名。

### 4.2 业务模块内部结构

业务模块按需要创建以下目录，不要求空目录占位：

```txt
<module>/
  domain/                业务对象、值对象、纯规则、领域类型
  application/           用例、用例级权限、错误收口和跨能力编排
  ports/                 store、codec、外部能力等接口
  adapters/              外部格式或第三方契约翻译
  persistence/           Kysely store 与数据库行映射
  http/                  controller、请求/响应 DTO、HTTP 错误映射
  events/                模块公开的领域事件契约
  contracts/             供其他模块使用的窄接口与类型
  infrastructure/        无法归入格式适配或持久化的具体基础设施
  testing/               可复用 fake、builder 和测试适配器
  <module>.module.ts      Nest 模块级 composition root
```

模块当前可能保留少量历史目录，例如 `auth/dto`。修改相关代码时应向上述结构收敛，避免为目录整齐进行无关搬迁。

### 4.3 依赖方向

模块内的标准依赖关系：

```txt
http -> application -> domain
                 \----> ports
adapters ----------------> ports + domain
persistence -------------> ports + domain
module -> http + application + concrete adapters + persistence
domain -> module-local domain code only
```

跨模块依赖只允许指向提供方公开的稳定边界：

```txt
consumer application/adapter -> provider contracts
consumer application/adapter -> provider application facade
consumer event listener ------> provider events
```

具体约束：

- `domain` 不导入 NestJS、Kysely、HTTP 类型、第三方 SDK、环境变量或外部格式字段。
- `application` 依赖本模块 `domain`、`ports`，以及明确的 API 级应用契约，如 `UnitOfWork` 和领域事件发布器。跨模块协作时可以依赖提供方公开的 contract、application facade 或 event。
- `application` 不导入 controller、请求 DTO、Kysely store 或具体第三方 client。
- `http` 负责协议解析、DTO 校验、认证上下文读取、响应投影和错误到 HTTP 的映射。
- `adapters` 与 `persistence` 实现 port，可以接触外部格式、SDK、文件系统、数据库和远程协议。
- `<module>.module.ts` 负责构造 use case 并把具体实现绑定到 port token，不放业务判断。
- 业务模块之间通过稳定 port、公开事件或更上层的应用用例协作，不能直接调用对方的 persistence 实现。

跨模块调用存在三种明确形式：

- 公开 contract：提供给其他模块使用的窄接口和语义类型，放在提供方的 `contracts`。`files/contracts` 的资源生命周期接口属于这一类。
- application facade：提供方 use case 可以作为同步应用能力由其他模块注入。调用方只依赖公开命令、结果和稳定 application error，不能进入提供方 persistence。
- 领域事件监听器：消费其他模块公开事件的 listener 放在消费方 `application`，Nest 的 `@OnEvent` 仅用于入站接线，监听器内部仍通过本模块 port 完成工作。

调用外部模块 application facade 的 adapter 可以把对方错误翻译成本模块 port error，例如角色头像 adapter 对文件能力的封装。新增跨模块依赖时优先选择更窄的 contract；只有现有用例本身就是所需业务能力时才直接使用 application facade。

### 4.4 `domain`

`domain` 表达内部业务概念和纯规则。其代码应能脱离 Nest、数据库和网络直接进行单元测试。

适合放置：

- 角色卡、世界书、预设、模型连接等业务对象。
- 可见性、条目角色、插入位置等领域类型。
- 状态转换、排序约束、对象内部不变量和纯派生计算。

外部字段解析、SQL 列名、HTTP status、环境配置和 provider 请求结构均属于外层。

项目当前以实用的领域模型为主，不要求每个模块机械地引入聚合根、值对象或领域服务。只有当规则和一致性边界确实需要时再增加这些概念。

### 4.5 `application`

每个 use case 表达一次完整的用户或系统意图，通常负责：

1. 接收已经由边界层解析的 command。
2. 通过 port 加载业务对象。
3. 执行用例级权限和存在性检查。
4. 调用领域规则并组织外部能力。
5. 在需要原子性的写操作中使用 `UnitOfWork`。
6. 发布需要同步处理的领域事件。
7. 将下层已知错误收口为稳定的 application error。

use case 使用语义明确的命令和返回值。不要把 Nest request、response 或 Kysely row 当作 command 传入。

### 4.6 `ports`、`adapters` 与 `persistence`

port 描述应用层需要什么能力，具体实现细节由外层决定。常见命名包括：

- `CharacterCardStore`：业务对象持久化。
- `CharacterCardCodec`：内部对象与兼容格式互转。
- `CharacterAvatarService`：头像资源能力。
- `ChatCompletionConnectionClient`：远端模型连接能力。

接口名应表达业务能力。禁止使用含义宽泛的 `XxxResolver`。

adapter 负责外部契约翻译。SillyTavern 的 `first_mes`、`creatorcomment`、`keysecondary`、PNG metadata 等字段只能出现在兼容 adapter 及其测试中。

persistence 负责：

- 实现 store 或数据访问 port。
- 使用 `@rolesta/db` schema 与 Kysely。
- 转换数据库行和模块内部对象。
- 处理分页、排序、JSON 列序列化和查询条件。

一个 store 围绕业务对象或一致性边界设计，无需为每张表创建 repository。

### 4.7 HTTP 与 OpenAPI

controller 是入站适配器，负责：

- 读取 path、query、body、header 和上传文件。
- 使用 DTO 和 validator 完成协议层校验。
- 调用 use case。
- 将 application result 投影为 response DTO。
- 将 application error 映射成 `ApiFailure`。

controller 不执行数据库查询或业务状态变更。缺少上传文件等纯协议问题可以在 HTTP 层拒绝，文件内容解析交给 codec 或文件能力。

API 通过 Swagger 生成 `apps/api/openapi.json`，Web 再生成：

```txt
apps/web/src/lib/api/generated/schema.ts
```

接口签名变化后执行：

```powershell
pnpm openapi:generate
```

生成文件不得手工编辑。API 和 Web 之间优先通过生成类型保持一致。

### 4.8 错误模型

错误沿边界逐层翻译：

```txt
DomainError / PortError / infrastructure error
  -> ApplicationError
  -> ApiFailure
  -> ApiErrorEnvelope
  -> Web ApiError + i18n message
```

`RolestaError` 提供稳定的 `reason`、语义化 `params` 和用于日志排障的 `cause`。`message` 不承载最终用户文案。

- domain 与 port 使用各自模块的稳定 reason。
- application mapper 只翻译已知错误，未知异常继续向全局异常过滤器传播。
- HTTP mapper 决定 status、公共错误码和响应参数。
- `ApiExceptionFilter` 统一输出 envelope，并在边界记录一次日志。
- 数据库错误、SDK 原始响应、凭据、SQL、堆栈和内部路径不得进入响应体。

新增错误时必须同时检查 application mapper、HTTP mapper、OpenAPI 响应和 Web i18n 映射。

### 4.9 事务与 Unit of Work

需要多个写操作共同成功或失败的 use case 使用 `UnitOfWork.run()`。`KyselyUnitOfWork` 通过 `AsyncLocalStorage` 保存当前事务，使同一异步调用链中的 store 自动加入事务；嵌套调用复用已有事务。

事务边界由 application use case 决定。store 不主动开启独立业务事务，controller 也不管理事务。

不要为了每个单表写操作机械地增加事务。涉及多表一致性、资源引用变更、事件监听器同步写入或检查后写入时，应明确评估原子性需求。

### 4.10 同步领域事件

模块公开事件放在 `<module>/events`，事件类型使用过去式业务事实命名，例如 `CharacterDeletedEvent`。

当前 `DomainEventPublisher` 基于 Nest EventEmitter 的 `emitAsync`，它承担提交前事务内通知。监听器与发布者处于同一进程，发布者会等待所有监听器完成；多个监听器可能并发执行，没有顺序保证。事件主要用于跨模块解除引用、同步派生状态等协作。监听器失败会向发布用例传播；事件在 `UnitOfWork.run()` 内发布时，失败会导致共享的数据库事务回滚。

事务内监听器应执行能够加入当前 Unit of Work 的数据库操作。外部 HTTP、文件写入和其他非事务副作用无法随数据库回滚；确需执行时，必须先设计幂等、补偿或提交后投递语义。监听器之间不得依赖执行顺序。

当前机制不提供跨进程投递、持久化重试或最终一致性保证。需要这些能力时应单独设计 outbox 或消息基础设施，不能假设现有事件发布器已经具备。

### 4.11 配置与装配

配置由 `apps/api/src/config` 读取、校验和归一化。业务模块和 use case 不直接读取 `process.env`。

`app.module.ts` 是应用级 composition root，`<module>.module.ts` 是模块级 composition root。只有装配层可以同时认识 port 和具体实现。构造依赖时优先显式注入 clock、ID 生成器、store、codec、client 和 Unit of Work，使 use case 可以通过普通对象进行测试。

## 5. Web 代码组织

### 5.1 顶层结构

```txt
apps/web/src/
  app/                   Router、全局 providers 和应用入口组合
  components/
    ui/                  shadcn/ui 与通用 UI primitive
  features/              按业务功能组织的页面和交互
  lib/                   API client、i18n、认证 token、通知等通用设施
  styles/                全局样式与设计 token
  main.tsx               浏览器入口
```

`app` 只组合路由和全局 provider。业务页面、查询与交互状态归所属 feature。

### 5.2 Feature 内部结构

feature 按需要采用：

```txt
features/<feature>/
  api/                   该功能的类型化 API 函数
  components/            页面和功能组件
  hooks/                 查询、mutation 和可复用交互状态
  model/                 表单模型、纯转换、排序等前端领域逻辑
  routes/                路由入口与 route guard
  schemas/               Zod 表单或输入 schema
  lib/                   仅该 feature 使用的基础帮助代码
```

组织原则：

- route 组件负责页面入口和 feature 组合，复杂交互下沉到 feature component 或 hook。
- `api` 文件通过 `openapi-fetch` 和 `requestApi` 调用后端，并复用生成的 request/response 类型。
- TanStack Query 的 query、mutation、缓存更新和失效规则放在 feature hook 或紧邻使用场景的位置。
- 表单状态与 API DTO 不完全一致时，在 `model` 中定义编辑器模型和双向转换。
- 纯排序、转换、校验逻辑应从渲染组件中提取，并编写单元测试。
- 组件优先复用 `components/ui` 和现有 feature 组件，避免创建只转发参数的薄组件。

### 5.3 Feature 依赖边界

推荐依赖方向：

```txt
app -> feature routes/components
feature components -> feature hooks/model/api + shared UI
feature hooks -> feature api/model + lib
feature api -> lib/api + generated schema
lib -> @rolesta/shared or external libraries
```

普通业务 feature 不应直接导入另一个 feature 的内部组件或 hook。`workspace` 和 `chats` 属于组合 feature：`workspace` 可以导入角色卡、世界书、预设和模型连接等功能明确用于嵌入的 manager 组件，`chats` 可以组合 workspace shell。此类入口应保持稳定、语义明确，组合层不能导入被组合 feature 的草稿状态、私有 hook 或内部 API 实现。

出现第二个跨 feature 消费者时，应为提供方建立明确的公开入口并统一迁移调用方。只有一个 composition root 使用的组件无需为了形式完整增加 barrel 文件。

全局 provider 只放确实覆盖整个应用生命周期的能力。局部草稿、编辑器会话和面板状态应由最接近其生命周期的 feature provider 管理。

### 5.4 API、错误与国际化

`lib/api/client.ts` 统一处理：

- API base URL。
- `Authorization` 和 `Accept-Language` header。
- API envelope 校验。
- 网络失败与响应失败的 `ApiError`。

feature API 不重复实现认证 header 或 envelope 解析。二进制下载等无法由生成 client 完整表达的场景可以直接使用 `fetch`，仍需复用现有认证和语言 header 方法。

用户可见文本通过 i18next 资源管理。API 返回稳定错误码和 i18n key，Web 负责将其转换为当前语言文案。组件内禁止拼接后端内部错误信息作为用户提示。

## 6. 数据与兼容格式

SQLite 是当前默认数据库。需要检索、过滤、排序或建立约束的数据使用普通列；兼容快照和无法稳定建模的外部扩展可以保留为 JSON 文本。JSON 快照不能替代核心业务字段建模。

外部导入流程遵循：

```txt
HTTP upload
  -> codec adapter validates and parses external format
  -> internal domain/application representation
  -> use case applies owner, identity, timestamps and permissions
  -> store persists normalized fields and compatibility snapshot
```

外部格式字段只在 adapter 边界传播。内部代码统一使用 Rolesta 领域语言，兼容快照用于排查、重新解释和导出。

## 7. 命名与文件组织

- use case：`<verb>-<subject>.use-case.ts`，类名为 `<Verb><Subject>UseCase`。
- store port：`<subject>-store.ts`，接口名为 `<Subject>Store`。
- 外部能力 port：使用具体业务能力命名，如 `CharacterAvatarService`。
- adapter：名称包含外部系统或格式，如 `SillyTavernCharacterCardCodec`。
- persistence：名称包含技术实现，如 `KyselyCharacterCardStore`。
- HTTP DTO：按 request/response 语义命名，避免与 domain 类型共用同一个类。
- domain event：过去式事实名称，文件使用 `.event.ts`。
- 测试：与被测代码相邻的 `*.spec.ts`，端到端测试放应用的 `test` 或 `tests` 目录。

文件应保持单一职责。只有在抽取后形成稳定语义、降低真实重复或隔离边界时才增加抽象。禁止添加无用的薄辅助方法和防御性兜底分支。

## 8. 测试策略

测试范围按风险逐层扩大：

| 变更类型                              | 最低验证                                 |
| ------------------------------------- | ---------------------------------------- |
| domain 纯规则、model 转换、通用纯函数 | 相邻 Vitest 单元测试                     |
| use case、错误 mapper、hook           | 单元测试，依赖使用明确 fake 或 mock      |
| Kysely store、事务、迁移              | 使用测试数据库的集成测试                 |
| controller、认证、OpenAPI envelope    | API e2e 测试                             |
| 关键用户流程、响应式交互              | Web Playwright 测试                      |
| 跨 workspace 契约                     | 相关包测试、类型检查及必要的生成文件检查 |

测试应验证公开行为和边界契约。不要通过复制实现细节来构造断言。修复缺陷时先补充能重现问题的测试；修改迁移、事务、事件或共享协议时扩大验证范围。

## 9. 新增或修改功能的推荐流程

1. 从 `README.md` 确认产品边界，并核对所属模块的现有术语。
2. 找到功能所属业务模块，确认现有对象、用例、port 和页面组织。
3. 先定义行为和边界，再决定是否需要 domain 类型、port、事务或事件。
4. API 从内部业务表示开始，随后实现 use case、port、adapter/persistence 和 HTTP 接线。
5. 修改 HTTP 契约后生成 OpenAPI 类型，再在 Web feature 中接入。
6. 数据结构变化通过新迁移实现，在 `migrations/index.ts` 注册，并同步 schema 与 persistence 映射。
7. 为规则、用例、持久化和用户流程补充与风险匹配的测试。
8. 执行受影响 workspace 的测试、类型检查和 lint；跨包变更再执行根级验证。
9. 检查 README、ADR 和本文是否需要随架构变化更新。

是否引入新抽象时，可以依次判断：

- 这段代码表达业务规则、用例编排、能力契约，还是具体技术实现？
- 它的生命周期和所有权属于哪个模块？
- 去掉 HTTP、数据库或第三方服务后，核心行为能否独立测试？
- 跨模块协作是否可以通过已存在的 port 或事件表达？
- 新抽象是否减少了真实复杂度？

## 10. 代码审查清单

- 领域术语是否与产品文案和当前代码约定一致。
- domain 和 application 是否泄漏 HTTP、Kysely、SDK 或兼容格式细节。
- controller 是否只处理协议并调用 use case。
- store、codec、client 等 port 是否表达清楚的业务能力。
- 事务是否包住完整的一致性边界，事件失败语义是否明确。
- 已知错误是否完成 application、HTTP 和 Web 各层映射。
- Web 是否复用 OpenAPI 生成类型、公共 API client 和 i18n。
- 数据库变化是否通过新迁移完成，schema 和 persistence 是否同步。
- 跨 feature、跨模块和跨 workspace 的依赖是否符合所有权边界。
- 测试是否覆盖变更行为、失败路径和受影响的边界。
- 文档是否把规划中的能力误写成已经实现。

## 11. 架构文档维护

- `README.md` 记录产品定位、启动方式和开发指南入口。
- 本文记录当前有效的工程结构和开发约定。
- `docs/adr` 记录难以逆转、存在真实取舍且缺少上下文会令人困惑的架构决策。
- `docs/superpowers/specs` 与 `docs/superpowers/plans` 是阶段性设计和实施记录，不能覆盖当前代码与本文形成的事实。

当代码与本文不一致时，先判断代码偏离了约定，还是架构已经合理演进。前者应修正代码，后者应同步更新本文并在满足条件时补充 ADR。
