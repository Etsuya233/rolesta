# Rolesta 开发入口

Rolesta 是一个面向角色扮演聊天的 TypeScript monorepo，围绕角色卡、Persona、世界书、预设、模型连接、聊天偏好和会话提供兼容资产管理与上下文调试能力。当前产品边界以 [README.md](README.md) 为准。

## 文档

所有开发任务开始前先阅读 [开发工作流](docs/development/development-workflow.md)，再按任务范围阅读其余文档；涉及跨层或跨 workspace 改动时应全部阅读。

- [开发工作流](docs/development/development-workflow.md)：开始开发、工作区检查、Worktree、分支、验证和提交约定。
- [目录与架构](docs/development/architecture.md)：monorepo 目录、workspace 职责、API 与 Web 的代码组织。
- [运行与配置](docs/development/running-and-configuration.md)：工具版本、环境文件、启动、迁移和常用命令。
- [核心代码边界](docs/development/code-boundaries.md)：依赖方向、模块协作、事务、事件、错误和兼容格式边界。
- [测试与验证](docs/development/testing-and-verification.md)：按风险选择测试范围、执行验证和完成审查。
- [项目文档维护](docs/development/documentation.md)：文档职责、目录归档和架构变更时的同步要求。

## Agent skills

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default five-label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain documentation layout. See `docs/agents/domain.md`.

## SillyTavern Source Code

If you need it, please refer to source code in maybe the following paths.

 - D:\programming\SillyTavern 
 - C:\Users\Etsuya\Softwares\SillyTavern