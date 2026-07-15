# 测试与验证

测试范围随变更风险和影响边界扩大。修复缺陷时先增加能够重现问题的测试；迁移、事务、事件和共享协议变更需要覆盖相关集成边界。

| 变更类型                              | 最低验证                            |
| ------------------------------------- | ----------------------------------- |
| domain 纯规则、model 转换、通用纯函数 | 相邻 Vitest 单元测试                |
| use case、错误 mapper、hook           | 单元测试，依赖使用明确 fake 或 mock |
| Kysely store、事务、迁移              | 使用测试数据库的集成测试            |
| controller、认证、OpenAPI envelope    | API e2e 测试                        |
| 关键用户流程、响应式交互              | Web Playwright 测试                 |
| 跨 workspace 契约                     | 相关包测试、类型检查和生成文件检查  |

测试应验证公开行为与边界契约，避免复制实现细节构造断言。

## 开发流程

1. 从 `README.md` 确认产品边界，并核对所属模块的现有术语。
2. 找到功能所属模块，确认现有对象、用例、port 和页面组织。
3. 定义行为与边界，再决定是否需要 domain 类型、port、事务或事件。
4. API 从内部业务表示开始，依次实现 use case、port、adapter 或 persistence 和 HTTP 接线。
5. 修改 HTTP 契约后生成 OpenAPI 类型，再在 Web feature 中接入。
6. 数据结构变化通过新迁移完成，并同步 schema、迁移注册和 persistence 映射。
7. 为规则、用例、持久化与用户流程补充匹配风险的测试。
8. 执行受影响 workspace 的测试、类型检查和 lint；跨包变更执行根级验证。
9. 检查 README、开发文档与 ADR 是否需要同步更新。

决定是否引入新抽象时，确认代码表达的是业务规则、用例编排、能力契约或具体技术实现，并判断它的生命周期与所有权。核心行为应能在移除 HTTP、数据库或第三方服务后独立测试；跨模块协作优先复用已有 contract、port 或事件。新抽象只有在减少真实复杂度、隔离变化或消除有意义的重复时才成立。

## 提交前验证

至少运行受影响 workspace 的测试、类型检查和 lint，并执行：

```powershell
pnpm format:check
```

跨 workspace 或构建链路的改动补充运行根级命令：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

涉及关键 Web 流程时运行 `pnpm test:e2e`。验证命令、范围和未执行项应在交付说明中明确记录。

## 审查清单

- 领域术语与产品文案、当前代码约定一致。
- domain 和 application 没有泄漏 HTTP、Kysely、SDK 或兼容格式细节。
- controller 只处理协议并调用 use case，port 表达清楚的业务能力。
- 事务覆盖完整一致性边界，事件失败与副作用语义明确。
- 已知错误完成 application、HTTP、OpenAPI 和 Web 各层映射。
- Web 复用生成类型、公共 API client 和 i18n。
- 数据库变化通过新迁移完成，schema、迁移注册和 persistence 已同步。
- 跨 feature、模块与 workspace 的依赖符合所有权边界。
- 测试覆盖变更行为、失败路径与受影响边界。
- 文档没有把规划能力描述为当前实现。
