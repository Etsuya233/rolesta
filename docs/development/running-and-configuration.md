# 运行与配置

## 环境要求

- Node.js 22 或更高版本。
- pnpm 11 或更高版本。
- API 使用 NestJS、Kysely、SQLite、class-validator 和 Swagger/OpenAPI。
- Web 使用 React、React Router、TanStack Query、openapi-fetch、i18next、Tailwind CSS 和 shadcn/ui。
- 单元测试与集成测试使用 Vitest，Web 端到端测试使用 Playwright。

仓库根目录的 `mise.toml` 固定了经过验证的 Node.js 24.18.0 和 pnpm 11.9.0。推荐执行：

```powershell
mise install
```

使用 mise 时，可将 `(& mise activate pwsh) | Out-String | Invoke-Expression` 加入 PowerShell profile。其他版本管理工具也可以使用，但版本必须满足 `package.json` 的 engines 约束。

## 首次启动

```powershell
pnpm install --trust-lockfile
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
Copy-Item packages/db/.env.example packages/db/.env
pnpm --filter @rolesta/db build
pnpm db:migrate
pnpm dev
```

默认地址：

- Web：`http://127.0.0.1:5173`
- API：`http://127.0.0.1:3000`
- API 文档：`http://127.0.0.1:3000/docs`

`pnpm db:migrate` 运行 `packages/db/dist/migrator.js`。全新检出或修改数据库包源码后，先构建 `@rolesta/db`，再执行迁移。

## 配置边界

API 配置由 `apps/api/src/config` 读取、校验和归一化。业务模块与 use case 不直接读取 `process.env`。本地环境文件不提交到 Git；新增配置项时同步更新对应的 `.env.example`、配置校验和使用文档。

`apps/api/src/app.module.ts` 是应用级 composition root，`<module>.module.ts` 是模块级 composition root。装配层负责将 port 与具体实现绑定，业务判断留在 domain 或 application。

## 常用命令

```powershell
pnpm dev
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

使用 `pnpm format` 格式化源码。只修改单个 workspace 时，优先运行过滤命令缩短反馈时间：

```powershell
pnpm --filter @rolesta/api test
pnpm --filter @rolesta/web typecheck
pnpm --filter @rolesta/db test
pnpm --filter @rolesta/shared test
```

## 数据库变更

新增或修改字段时创建下一条迁移，同步更新 `packages/db/src/schema`，并在 `packages/db/src/migrations/index.ts` 导入和注册迁移。遗漏注册的迁移不会执行。已经进入共享环境的迁移通过新增迁移修正，禁止改写历史文件。

## OpenAPI 生成

API 通过 Swagger 生成 `apps/api/openapi.json`，Web 类型生成到 `apps/web/src/lib/api/generated/schema.ts`。接口签名变化后执行：

```powershell
pnpm openapi:generate
```

生成文件不得手工编辑。
