# Rolesta 异常体系设计

## Context

Rolesta API 当前已经有 `ApiFailure`、`ApiExceptionFilter`、各业务模块自己的 application error，以及统一的 API envelope。但错误体系仍然分散，`reason`、`params`、`messageKey`、日志边界和分层语义没有统一收口。

这份设计的目标，是把异常体系收成一条清晰的链：`DomainError`、`PortError`、`ApplicationError`、`ApiFailure`。对外响应只暴露 i18n key 和语义参数，内部细节只进日志。

## Goals

- 每个异常都带 `reason` 枚举。
- 每个异常都带语义明确的 `params`。
- `Domain`、`Port`、`Application` 各自保留自己的错误类型。
- `Application` 负责接住并翻译下层错误。
- HTTP 层只输出 `ApiFailure` 和 i18n 约定。
- 日志集中在应用边界或 HTTP 边界，避免重复打印。

## Non-Goals

- 不一次性重写所有业务模块的错误枚举。
- 不改变现有 API envelope 的整体形状。
- 不引入独立的全局错误仓库或跨模块共享业务 reason。
- 不把用户可见文案放回 domain 或 application。

## Recommended Approach

建立一个公共基类 `RolestaError`，放在 `apps/api/src/common/errors`。它只负责三个字段：`reason`、`params`、`cause`。

在它之上分三层：

- `DomainError`：领域规则失败。
- `PortError`：外部能力失败，比如数据库、远端 API、文件 codec。
- `ApplicationError`：应用层稳定错误，对外可映射成 HTTP 协议错误。

每个模块各自维护自己的错误规格和映射表：

- `application` 里维护 `DomainError -> ApplicationError` 和 `PortError -> ApplicationError`。
- `http` 里维护 `ApplicationError -> ApiFailure`。

`UseCase` 的 `execute()` 方法使用共享的方法级 decorator 包一层，在执行时自动翻译下层错误。调用方仍然直接调用 `useCase.execute()`，不用额外入口。

## Error Model

`reason` 使用模块内的字符串枚举，保持稳定和可读。

`params` 必须是语义参数，字段名要直接表达业务含义。比如 `characterId`、`fileName`、`providerId`、`entryKey`、`baseUrl`。禁止使用空泛字段名。

`cause` 只用于保留底层原始异常，便于日志排障，不进入对外响应。

对外响应只暴露：

- `code`
- `msg`
- `data`

其中 `msg` 始终使用 `i18n:<key>`，`data` 承载安全的语义参数。

## Module Structure

每个业务模块建议保留这几类文件：

```txt
<module>/domain/*-error.ts
<module>/ports/*-error.ts
<module>/application/*-error.ts
<module>/application/*-error.mapper.ts
<module>/http/*-error.mapper.ts
common/errors/use-case.decorator.ts
```

`application` 里的 mapper 负责把 domain/port 错误翻成本模块的 `ApplicationError`。`http` 里的 mapper 再把 `ApplicationError` 翻成 `ApiFailure`。

## Data Flow

1. `domain` 发现规则失败，抛 `DomainError`。
2. `ports` 或 adapter/persistence 发现能力失败，抛 `PortError`。
3. `execute()` 上的方法级 `@UseCase(errorMapper)` decorator 捕获这些错误。
4. decorator 调用模块内 application mapper，重新抛出 `ApplicationError`。
5. HTTP mapper 把 `ApplicationError` 转成 `ApiFailure`。
6. `ApiExceptionFilter` 统一打印日志并返回 envelope。

## Logging

日志只在最终边界统一打印一次。

- 预期业务失败记录 `warn` 或 `info`。
- 未识别异常记录 `error`。
- 日志至少包含 `reason`、`params`、请求方法、请求路径和 `cause`。

日志里的细节不回传给浏览器、OpenAPI 响应或前端错误文案。

## Testing

- `RolestaError` 能保留 `reason`、`params` 和 `cause`。
- domain mapper 能把领域错误翻成 application error。
- port mapper 能把外部能力错误翻成 application error。
- HTTP mapper 能把 application error 翻成 `ApiFailure`。
- 异常过滤器只返回 i18n 约定，不泄露原始异常消息。
- 日志测试能覆盖预期失败和未知异常的分支。

## Implementation Order

1. 新增 `apps/api/src/common/errors` 基类和子类。
2. 抽一个模块先接入完整错误链。
3. 为该模块补 application mapper 和 HTTP mapper。
4. 为 use case `execute()` 加方法级 decorator。
5. 更新 `ApiExceptionFilter` 的收口逻辑。
6. 逐模块迁移现有异常。
7. 补测试。

## Acceptance Criteria

- 每个异常实例都带 `reason` 和语义化 `params`。
- domain、port、application、http 各层职责清楚。
- 浏览器等外部只看到 i18n key 和安全参数。
- 底层异常信息不会泄露到响应体。
- 日志只在边界层出现一次。
