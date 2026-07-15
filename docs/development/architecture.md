# 目录与架构

本文描述 Rolesta 当前有效的工程结构和各 workspace 的职责。目录中的空模块、阶段性设计文档或产品规划不表示对应能力已经完成。

## 总体结构

Rolesta 采用 TypeScript monorepo，Turborepo 负责任务编排，pnpm 管理 workspace。

```txt
rolesta/
  apps/
    api/                 NestJS API
    web/                 React Web 应用
  packages/
    config/              ESLint、Prettier、TypeScript 共享配置
    db/                  数据库 schema、迁移和方言
    shared/              跨应用协议类型与通用纯能力
  docs/
    adr/                 长期有效的架构决策
    development/         当前开发约定
    specs/               阶段性设计记录
    plans/               阶段性实施计划
    handoffs/            工作交接记录
  package.json           根命令和工具版本
  pnpm-workspace.yaml    pnpm workspace 定义
  turbo.json             Turborepo 任务图
```

主要运行时调用链如下：

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

依赖朝业务规则和稳定契约流动。数据库、HTTP、第三方 SDK 与外部文件格式位于边界层。

## Workspace 职责

### `apps/api`

API 是业务用例的执行边界，负责认证、权限、领域规则编排、持久化协调、兼容格式转换和 HTTP 输出。它可以依赖 `@rolesta/db`、`@rolesta/shared` 以及所需基础设施库，具体技术依赖应留在外层实现。

`apps/api/src` 按业务能力与运行时支撑能力划分：

```txt
apps/api/src/
  auth/                 认证与初始管理员
  users/                用户及头像
  characters/           角色卡
  worldbooks/           世界书
  presets/              预设
  model-profiles/        模型连接
  chat-preferences/      聊天偏好与资产默认值
  files/                文件资源与生命周期
  chats/                会话能力
  generation-debug/     生成调试能力
  common/               API 内部共享契约、错误和事件设施
  database/             Kysely 连接、事务上下文和 Unit of Work
  config/               配置加载、校验和归一化
  http/                 全局 HTTP envelope、filter、interceptor
  logging/              日志装配
  openapi/              OpenAPI 文档生成
  app.module.ts         应用级 composition root
  main.ts               进程入口
```

业务模块按实际需要采用以下结构，无需创建空目录占位：

```txt
<module>/
  domain/                业务对象、值对象、纯规则和领域类型
  application/           用例、用例级权限和跨能力编排
  ports/                 store、codec、外部能力等接口
  adapters/              外部格式或第三方契约翻译
  persistence/           Kysely store 与数据库行映射
  http/                  controller、DTO 和 HTTP 错误映射
  events/                模块公开的领域事件
  contracts/             供其他模块使用的窄接口与类型
  infrastructure/        其他具体基础设施
  testing/               可复用 fake、builder 和测试适配器
  <module>.module.ts      Nest 模块级 composition root
```

业务模块按实际职责组织，目录调整应服务于当前任务，避免为了形式统一进行无关搬迁。

### `apps/web`

Web 是产品交互层，消费 OpenAPI 生成类型，按功能组织页面、状态、表单和 API 调用。Web 可以依赖 `@rolesta/shared`，不得依赖 `@rolesta/db` 或导入 API 源码。

```txt
apps/web/src/
  app/                   Router、全局 providers 和应用入口组合
  components/ui/         shadcn/ui 与通用 UI primitive
  features/              按业务功能组织的页面和交互
  lib/                   API client、i18n、认证和通知等设施
  styles/                全局样式与设计 token
  main.tsx               浏览器入口
```

业务 feature 根据需要采用 `api`、`components`、`hooks`、`model`、`routes`、`schemas` 和 `lib` 子目录。`app` 只负责路由和全局 provider 的组合，业务页面、查询和交互状态归所属 feature。

### `packages/db`

`@rolesta/db` 维护 Kysely schema 类型、SQLite 方言、顺序迁移和数据库测试工具。业务查询与业务对象映射归 `apps/api/src/<module>/persistence`，schema 只描述存储结构。

### `packages/shared`

`@rolesta/shared` 存放跨应用复用的稳定契约和无业务归属的纯能力，例如 API envelope、稳定错误码、分页、时间与 tokenizer。角色卡、世界书、预设等领域对象保留在所属 API 模块。

### `packages/config`

`@rolesta/config` 提供 ESLint、Prettier 和 TypeScript 基础配置，只参与开发工具链。
