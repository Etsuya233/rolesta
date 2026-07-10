# Toast 功能设计

## Context

Rolesta Web 当前使用 Shadcn UI、React Query 和 i18next，但尚无全局瞬时通知能力。操作结果与请求失败主要通过页面内联文案反馈，难以覆盖无需占用表单区域的信息提示和异常反馈。

本次仅建立 Toast 基础设施。既有业务页面、React Query 默认配置和 API 客户端的行为保持不变，后续需求可按需接入。

## Goals

- 使用 Shadcn UI 的 Sonner 集成提供全局 Toast。
- 支持成功、信息、警告和错误四类显式通知。
- 让业务代码能直接调用 Sonner API，无需额外承载层。
- 复用现有 i18n 与 API 错误消息映射。
- Toast 的视觉风格与现有亮暗主题变量一致。

## Non-Goals

- 不批量改造已有页面的成功或失败反馈。
- 不在 React Query、API 客户端或路由层自动弹出 Toast。
- 不替换表单字段校验和页面内联错误。
- 不新增跨功能模块的通知服务或包装 API。

## Approaches Considered

### 直接使用 Sonner API

安装 `sonner`，新增 Shadcn 风格的 `Toaster` UI 组件，并在应用 Provider 树中挂载一次。业务代码直接从 `sonner` 导入 `toast` 并调用对应方法。

该方案调用路径短，保留 Sonner 的原生选项和返回值，也避免产生无业务语义的包装层。采用此方案。

### 包装为通知服务

可以新增 `notify` 模块收口 `success`、`error` 等方法，但现阶段没有跨模块的通知规则或统一上下文需要承载，这一层只会转发 Sonner 调用，因此不采用。

### 全局自动错误通知

可以在 React Query 或 API 客户端中捕获失败并统一显示 Toast。这会与当前页面保留的内联错误产生重复反馈，也无法准确反映每个交互是否适合弹出通知，因此不纳入本次范围。

## Architecture

新增 `apps/web/src/components/ui/sonner.tsx`，以 Shadcn UI 的 Sonner 组件模式封装唯一的渲染入口。组件使用现有 CSS 变量适配亮暗主题，固定在右上角，提供关闭按钮和统一的默认显示时长。

`AppProviders` 在 `I18nextProvider` 与 `QueryClientProvider` 范围内挂载一次 `Toaster`。应用的任何路由和保活页面共享同一个通知容器，路由切换不会重复创建容器。

业务模块直接使用：

```ts
import { toast } from 'sonner';

toast.success(t('...'));
toast.info(t('...'));
toast.warning(t('...'));
toast.error(t('...'));
```

调用处可以使用 Sonner 原生的 `description`、`action`、`duration` 与关闭方法；基础设施不限制这些能力。

## Error Handling And I18n

Toast 只负责渲染调用方提供的内容，不解析异常对象，不捕获 Promise，也不触发重试。

当业务代码决定向用户展示 `ApiError` 时，调用处先通过现有 `formatApiMessage()` 将 API 的 `i18n:` 消息解析为当前语言，再将结果传给 `toast.error()`。网络异常和其他本地异常由调用处根据交互语义提供文案。

字段级校验继续显示在原表单位置。适合 Toast 的情形包括异步操作完成、不可归属到单个字段的失败，以及用户需要在当前页面继续操作时的简短状态反馈。

## Testing

- 为 `Toaster` 增加组件测试，验证可在应用 Provider 环境下渲染。
- 验证 `toast.success`、`toast.info`、`toast.warning` 和 `toast.error` 的消息可显示。
- 验证含 i18n Provider 的基础渲染正常完成。
- 执行 Web 端相关测试和 TypeScript 类型检查。

## Acceptance Criteria

- `@rolesta/web` 声明 `sonner` 依赖。
- 应用生命周期内只挂载一个 `Toaster`。
- Web 端任意业务模块可直接使用 Sonner 的四类通知 API。
- API 客户端、React Query 默认配置和现有页面在未显式修改时不显示新 Toast。
- Toast 在亮暗主题下沿用 Rolesta 的颜色变量。
