# Toast 功能设计

## Context

Rolesta Web 当前使用 Shadcn UI、React Query 和 i18next，但尚无全局瞬时通知能力。操作结果与请求失败主要通过页面内联文案反馈，难以覆盖无需占用表单区域的信息提示和异常反馈。

本次仅建立 Toast 基础设施。既有业务页面、React Query 默认配置和 API 客户端的行为保持不变，后续需求可按需接入。

## Goals

- 使用 Shadcn UI 的 Sonner 集成提供全局 Toast。
- 支持成功、信息、警告和错误四类显式通知。
- 通过语义化通知模块隔离业务代码与 Sonner。
- 复用现有 i18n 与 API 错误消息映射。
- Toast 的视觉风格与现有亮暗主题变量一致。

## Non-Goals

- 不批量改造已有页面的成功或失败反馈。
- 不在 React Query、API 客户端或路由层自动弹出 Toast。
- 不替换表单字段校验和页面内联错误。

## Approaches Considered

### 直接使用 Sonner API

安装 `sonner`，新增 Shadcn 风格的 `Toaster` UI 组件，并在应用 Provider 树中挂载一次。业务代码直接从 `sonner` 导入 `toast` 并调用对应方法。

调用路径最短，但会让功能模块直接依赖第三方通知库，并重复处理 API 错误文案。本方案不采用。

### 包装为通知服务

新增 `notifications` 模块，向业务代码提供语义化的 `notify` API。除成功、信息、警告和错误通知外，该模块专门负责把 `ApiError` 转换为当前语言的错误通知。

该模块隔离 Sonner 依赖，收口统一的内容结构和 API 错误消息解析，并为后续的通知样式与行为扩展保留单一入口。采用此方案。

### 全局自动错误通知

可以在 React Query 或 API 客户端中捕获失败并统一显示 Toast。这会与当前页面保留的内联错误产生重复反馈，也无法准确反映每个交互是否适合弹出通知，因此不纳入本次范围。

## Architecture

新增 `apps/web/src/components/ui/sonner.tsx`，以 Shadcn UI 的 Sonner 组件模式封装唯一的渲染入口。组件使用现有 CSS 变量适配亮暗主题，固定在右上角，提供关闭按钮和统一的默认显示时长。

`AppProviders` 在 `I18nextProvider` 与 `QueryClientProvider` 范围内挂载一次 `Toaster`。应用的任何路由和保活页面共享同一个通知容器，路由切换不会重复创建容器。

新增 `apps/web/src/lib/notifications/notify.ts`。该模块是业务功能访问 Toast 的唯一入口，内部调用 Sonner。对外提供：

```ts
notify.success({ title: successMessage });
notify.info({ title: informationMessage, description: details });
notify.warning({ title: warningMessage });
notify.error({ title: errorMessage });
notify.apiError(error);
```

`success`、`info`、`warning` 和 `error` 接收统一的内容对象：必填 `title`、可选 `description`，以及经过明确筛选的通知交互配置。`apiError` 只接收 `ApiError`，用于处理有 API 响应的失败。

`notify` 将内容对象转换为 Sonner 调用，并返回 Sonner 的通知标识，以便业务代码在确有需要时主动关闭或更新通知。业务模块不从 `sonner` 导入任何内容。

业务模块使用：

```ts
import { notify } from '@/lib/notifications/notify';

notify.success({ title: successMessage });
```

首批交互配置保留 `duration` 与 `action`，避免业务层依赖 Sonner 的完整选项模型。新增配置需先确认存在跨功能的使用价值。

## Error Handling And I18n

Toast 基础设施不捕获 Promise，也不触发重试。

当业务代码决定展示 API 失败时，调用 `notify.apiError(error)`。该方法通过现有 `formatApiMessage()` 将 API 的 `i18n:` 消息解析为当前语言，再显示错误通知。网络异常和其他本地异常由调用处根据交互语义调用 `notify.error()` 并提供文案。

字段级校验继续显示在原表单位置。适合 Toast 的情形包括异步操作完成、不可归属到单个字段的失败，以及用户需要在当前页面继续操作时的简短状态反馈。

## Testing

- 为 `Toaster` 增加组件测试，验证可在应用 Provider 环境下渲染。
- 验证 `notify.success`、`notify.info`、`notify.warning` 和 `notify.error` 的消息可显示。
- 验证 `notify.apiError` 将 API 的 i18n 消息解析后显示。
- 验证含 i18n Provider 的基础渲染正常完成。
- 执行 Web 端相关测试和 TypeScript 类型检查。

## Acceptance Criteria

- `@rolesta/web` 声明 `sonner` 依赖。
- 应用生命周期内只挂载一个 `Toaster`。
- Web 端任意业务模块可通过 `notify` 使用四类通知 API。
- 业务模块无需直接依赖 `sonner` 或自行解析 API 错误消息。
- API 客户端、React Query 默认配置和现有页面在未显式修改时不显示新 Toast。
- Toast 在亮暗主题下沿用 Rolesta 的颜色变量。
