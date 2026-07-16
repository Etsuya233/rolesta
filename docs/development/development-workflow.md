# 开发工作流

本文适用于开始开发、创建独立工作区、验证变更和提交代码。所有开发任务在修改文件前均应阅读本文。

## 开始开发

从仓库根目录的 `AGENTS.md` 进入开发文档，按任务范围了解目录职责、代码边界、运行方式和验证要求。修改文件前执行 `git status`，识别并保留工作区中已有且与当前任务无关的改动。

## Worktree

需要 Git worktree 时，统一创建在仓库根目录的 `./.worktrees` 下。创建前确认目标分支和目录未被其他 worktree 使用，并在新工作区中再次检查 `git status`。

自动化开发代理只在用户明确要求时创建提交，不擅自改写现有提交历史、强制推送或清理他人的工作区改动。

## 分支与合并

`main` 是稳定分支，`dev` 是稳定开发分支。功能分支和日常开发内容默认合并到 `dev`；未收到明确要求时，不主动将内容合并到 `main`。

## 提交范围

每个提交表达一个可独立审查的逻辑变更。功能代码、对应测试和必须同步的文档可以放在同一提交中；无关格式化、顺手重构和其他功能应拆开。由源文件生成且仓库要求跟踪的产物，需要与源变更一同提交。

完成修改后按 [测试与验证](testing-and-verification.md) 执行与风险匹配的检查。准备提交时确认暂存区只包含当前提交所需文件。

## 提交信息

项目沿用 Conventional Commits 风格：

```txt
<type>(<scope>): <summary>

- reason: <reason for the change, optional>
- change: <implementation detail, optional>
- change: <implementation detail, optional>
```

`scope` 在能够清楚表达模块时使用，例如 `web`、`api`、`chats`、`development` 或 `toolchain`；全仓库变更可以省略。常用 `type` 包括：

- `feat`：新增用户或业务能力。
- `fix`：修复缺陷。
- `refactor`：调整内部实现且不改变既定行为。
- `docs`：只修改文档。
- `test`：只修改测试。
- `build`、`ci`：构建、依赖或持续集成变更。
- `style`：不改变行为的格式调整。
- `chore`：无法归入以上类型的维护工作。

提交标题与正文统一使用英文。`summary` 使用简洁的祈使语气，直接说明变更结果，不加句末标点。标题与正文之间保留一个空行。`reason` 说明修改原因，`change` 说明具体修改思路或实现内容；两个字段均可省略，`change` 可以按内容重复多行，提交时不保留占位文本。

存在兼容性破坏时，按 Conventional Commits 使用 `!` 和 `BREAKING CHANGE:` 明确标记。

示例：

```txt
docs(development): update contributor guidance

- reason: centralize contributor guidance
- change: organize development rules by topic
- change: document the commit body format
```
