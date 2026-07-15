# Model Provider API Connection Config Design

## 背景

Rolesta 当前已有角色卡和预设管理能力，预设领域模型中已经预留 `modelProviderId`，但 `model-profiles` 后端模块仍为空。接下来需要补齐独立的 Model Provider API 连接配置管理，用于保存 Chat Completions API 的连接信息、密钥和默认模型，并为后续预设、聊天生成链路提供稳定关联对象。

本次功能先作为独立管理页交付，页面和代码结构参考 CharacterCard 与 Preset：后端使用 NestJS controller、application use case、Kysely store 和 DTO 映射；前端使用单列页面栈、草稿会话、OpenAPI 生成类型和 i18n 文案。

## 目标

- 支持独立的 API 连接配置管理，配置可切换不同 Provider。
- 当前仅支持 Chat Completions 协议。
- 支持自定义兼容 Provider：`OpenAI Compatible`。
- 支持官方内置 Provider 注册表，首批包含 OpenAI、Claude、Z.AI、DeepSeek。
- Provider 选择区分组展示：自定义兼容配置在上方，官方内置配置在下方，中间使用分割线。
- `OpenAI Compatible` 允许手写 Base URL。
- 官方内置 Provider 禁止手写 Base URL，只能从注册表提供的 Base URL 中选择。
- 支持配置内密钥库，密钥可命名、编辑、复制、设为当前密钥、删除。
- 密钥按配置隔离，不能跨配置复用。
- 密钥可为空；无密钥时远程请求不发送 `Authorization` 头。
- 密钥明文保存在本地数据库，用于个人部署场景下的编辑和复制。
- 支持默认模型名手写。
- 支持远程获取模型列表，用于当前下拉选择。
- 模型列表不持久化，保存配置时只保存默认模型名。
- 支持测试连接，使用当前配置发起极短 Chat Completions 请求。
- 本次不接入 Preset 编辑页，后续再让 Preset 关联连接配置并覆盖模型名。

## 非目标

- 不支持非 Chat Completions 协议。
- 不实现 Claude 等 Provider 的原生 API。
- 不做密钥加密、环境变量引用或系统钥匙串集成。
- 不缓存远程模型列表。
- 不在本次实现 Preset 的 `modelProviderId` 选择和保存。
- 不在本次实现聊天生成链路调用。
- 不引入多租户、组织权限、审计日志或计费能力。

## 领域模型

API 连接配置作为聚合根。Provider 是配置内字段，切换配置时会同时切换 Provider、Base URL、默认模型和配置内密钥库。

```ts
export type ModelProviderKind = 'openai-compatible' | 'openai' | 'claude' | 'z-ai' | 'deepseek';

export type ModelProviderSource = 'custom' | 'official';

export interface ModelProviderConfig {
  id: string;
  ownerUserId: string;
  name: string;
  providerKind: ModelProviderKind;
  providerSource: ModelProviderSource;
  baseUrl: string;
  defaultModelName: string;
  selectedApiKeyId: string | null;
  apiKeys: ModelProviderApiKey[];
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface ModelProviderApiKey {
  id: string;
  configId: string;
  name: string;
  secret: string;
  createdAtMs: number;
  updatedAtMs: number;
}
```

`providerSource` 由 `providerKind` 推导保存，用于列表和 UI 展示。`openai-compatible` 属于 `custom`，首批官方 Provider 属于 `official`。后续新增官方 Provider 时，只扩展注册表和 i18n 文案。

`defaultModelName` 允许为空，便于先创建配置再补模型。测试连接要求它非空。

## Provider 注册表

后端和前端共享同一份 Provider 语义，后端注册表是最终校验来源。注册项包含：

```ts
interface ModelProviderCatalogItem {
  kind: ModelProviderKind;
  source: ModelProviderSource;
  displayName: string;
  baseUrls: string[];
  allowCustomBaseUrl: boolean;
}
```

首批注册：

| Provider            | Source   | Base URLs                                                             | 说明                                                            |
| ------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `openai-compatible` | custom   | 用户手写                                                              | 自定义兼容配置，允许手写 Base URL。                             |
| `openai`            | official | `https://api.openai.com/v1`                                           | OpenAI Chat Completions 标准端点前缀。                          |
| `claude`            | official | `https://api.anthropic.com/v1`                                        | Claude OpenAI SDK compatibility 端点，协议走 Chat Completions。 |
| `z-ai`              | official | `https://api.z.ai/api/paas/v4`, `https://api.z.ai/api/coding/paas/v4` | Z.AI OpenAI 兼容通用端点和 Coding Plan 端点。                   |
| `deepseek`          | official | `https://api.deepseek.com`                                            | DeepSeek OpenAI 兼容端点。                                      |

这些地址来自各提供商公开文档，后续实现时写入注册表常量。后端保存时校验官方配置的 `baseUrl` 必须命中对应注册项；自定义兼容配置必须提供非空 `baseUrl`。

Claude 条目使用 Anthropic 的 OpenAI SDK compatibility 能力。Anthropic 文档说明该兼容层主要面向测试与模型能力比较，后续如果需要长期生产能力，可以新增 Claude 原生 Provider 并走 Messages API。

Base URL 规范只处理末尾斜杠：内部调用拼接 `/models` 和 `/chat/completions` 时避免重复斜杠。远程响应结构不符合预期时返回明确错误。

## 数据库

新增表 `model_provider_configs`：

```txt
id varchar primary key
owner_user_id varchar not null references users(id) on delete cascade
name varchar not null
provider_kind varchar not null
provider_source varchar not null
base_url text not null
default_model_name varchar not null
selected_api_key_id varchar null
created_at_ms integer not null
updated_at_ms integer not null
last_used_at_ms integer null
usage_count integer not null
```

新增表 `model_provider_api_keys`：

```txt
id varchar primary key
config_id varchar not null references model_provider_configs(id) on delete cascade
name varchar not null
secret text not null
created_at_ms integer not null
updated_at_ms integer not null
```

索引：

- `model_provider_configs_owner_created_idx`: `owner_user_id`, `created_at_ms`
- `model_provider_configs_updated_idx`: `updated_at_ms`
- `model_provider_configs_name_idx`: `name`
- `model_provider_api_keys_config_idx`: `config_id`

`selected_api_key_id` 在应用层校验归属关系。删除当前密钥后，配置的 `selectedApiKeyId` 置为 `null`。

## 后端接口

所有接口需要登录。

```txt
GET    /model-providers/catalog
GET    /model-providers
GET    /model-providers/:id
POST   /model-providers
PATCH  /model-providers/:id
DELETE /model-providers/:id

POST   /model-providers/:id/api-keys
PATCH  /model-providers/:id/api-keys/:apiKeyId
DELETE /model-providers/:id/api-keys/:apiKeyId
PUT    /model-providers/:id/selected-api-key

POST   /model-providers/models/preview
POST   /model-providers/test-connection/preview
POST   /model-providers/:id/models
POST   /model-providers/:id/test-connection
```

预览接口用于创建/编辑页未保存草稿。已保存配置接口用于详情页快速重试。两类接口复用同一应用服务，不访问真实网络的单元测试通过注入端口实现。

创建和更新配置请求字段：

```ts
interface SaveModelProviderConfigRequest {
  name?: string;
  providerKind?: ModelProviderKind;
  baseUrl?: string;
  defaultModelName?: string;
  selectedApiKeyId?: string | null;
}
```

创建时 `name`、`providerKind`、`baseUrl` 必填。更新时只修改提交字段。设置 `selectedApiKeyId` 时必须属于当前配置。

密钥请求字段：

```ts
interface SaveModelProviderApiKeyRequest {
  name?: string;
  secret?: string;
}
```

新增密钥要求 `name` 和 `secret` 非空。编辑时可以只改名称或密钥值。详情响应返回密钥原文，前端复制按钮直接使用响应值。

模型列表预览请求：

```ts
interface ModelProviderConnectionPreviewRequest {
  providerKind: ModelProviderKind;
  baseUrl: string;
  apiKeySecret?: string;
}
```

模型列表响应：

```ts
interface ModelProviderModelListResponse {
  models: string[];
  elapsedMs: number;
}
```

测试连接预览请求：

```ts
interface TestModelProviderConnectionRequest {
  providerKind: ModelProviderKind;
  baseUrl: string;
  defaultModelName: string;
  apiKeySecret?: string;
}
```

测试连接响应：

```ts
interface TestModelProviderConnectionResponse {
  ok: true;
  modelName: string;
  elapsedMs: number;
  remoteResponseId: string | null;
}
```

## 远程请求端口

后端新增 Chat Completions 兼容客户端端口：

```ts
export interface ChatCompletionConnectionClient {
  listModels(request: ListChatCompletionModelsRequest): Promise<string[]>;
  testChatCompletion(request: TestChatCompletionRequest): Promise<TestChatCompletionResult>;
}
```

`listModels` 调用 `GET {baseUrl}/models`，读取 OpenAI 兼容响应中的 `data[].id`。该结果只返回给前端。

`testChatCompletion` 调用 `POST {baseUrl}/chat/completions`，发送极短消息、当前默认模型名、较小 `max_tokens`。成功表示该配置可用于聊天链路。未选择密钥时不设置鉴权头。

远程错误映射为应用错误：

- `invalid-provider`: Provider 不在注册表中。
- `invalid-base-url`: Base URL 为空或官方 Provider 的 Base URL 不在注册表中。
- `api-key-not-owned`: 密钥不属于当前配置。
- `model-name-required`: 测试连接时模型名为空。
- `remote-auth-failed`: 远程返回鉴权失败。
- `remote-model-not-found`: 远程返回模型不存在。
- `remote-unreachable`: 网络或 DNS 连接失败。
- `remote-error`: 远程返回其他非成功状态。
- `remote-response-invalid`: 远程响应结构无法识别。
- `not-found`: 配置或密钥不存在。

## 前端页面

新增路由 `/app/model-providers`，渲染 `ModelProviderManager`。页面结构沿用 Preset/Character 的单列页面栈：

```ts
type ModelProviderPage =
  | { name: 'list'; key: string }
  | { name: 'create'; key: string; sessionKey: string }
  | { name: 'edit'; key: string; configId: string; sessionKey: string }
  | { name: 'apiKeys'; key: string; configId: string; sessionKey: string };
```

列表页显示配置名称、Provider、Base URL 摘要、默认模型、更新时间，支持搜索、分页、排序和新建入口。

创建/编辑页使用折叠区：

- 基础信息：配置名称。
- Provider 与 Base URL：Provider 下拉分两组展示，上方自定义兼容配置，下方官方内置配置；自定义兼容配置显示 Base URL 输入框，官方配置显示 Base URL 下拉。
- 模型：默认模型名输入，获取模型列表按钮，获取成功后显示候选下拉，选择后写入默认模型名。
- 连接测试：显示当前测试状态、耗时、远程响应 ID 或错误摘要。

密钥管理页属于当前配置，显示密钥名称、是否当前密钥和更新时间。操作包括新增、重命名、编辑密钥值、复制密钥值、设为当前密钥、删除。删除当前密钥后当前密钥置空。配置可以没有密钥。

前端草稿会话保存创建/编辑页输入，页面栈切换时不丢失。复制密钥使用浏览器剪贴板 API；失败时展示错误，不修改密钥状态。

## 与 Preset 的关系

本次只完成独立配置管理，不修改 Preset 编辑页。后续 Preset 接入时：

- Preset 可以保存 `modelProviderId` 指向连接配置。
- Preset 可以保存自己的模型名覆盖配置默认模型。
- 聊天生成链路优先使用 Preset 模型名，空值时使用配置默认模型。

本次后端接口和领域模型保留稳定 ID 与默认模型字段，避免后续改表。

## i18n

新增 `modelProviders` 文案命名空间，覆盖英文、简体中文、繁体中文和日文。文案包含：

- 路由标题、列表空态、加载失败。
- Provider 分组标题：自定义兼容配置、官方内置配置。
- 字段标签：名称、Provider、Base URL、默认模型、密钥。
- 操作：新建、保存、删除、获取模型列表、测试连接、复制密钥、设为当前密钥。
- 错误消息：Provider 无效、Base URL 无效、模型名必填、远程鉴权失败、模型不存在、远程不可达、响应格式异常。

## 测试

后端测试：

- 自定义兼容配置允许手写 Base URL。
- 官方 Provider 只能选择注册表 Base URL。
- 密钥只能在所属配置中设为当前密钥。
- 删除当前密钥后配置当前密钥为空。
- 配置允许没有密钥。
- 默认模型名保存，模型列表不落库。
- 获取模型列表调用 Chat Completions 兼容客户端端口，返回模型 ID 数组。
- 测试连接要求模型名非空，无密钥时不发送鉴权头。
- 远程鉴权失败、模型不存在、网络失败、响应格式异常映射为明确应用错误。

前端测试：

- 页面栈从列表进入创建、编辑和密钥管理页。
- Provider 下拉分组顺序正确：自定义兼容配置在上方，官方内置配置在下方。
- 选择 `OpenAI Compatible` 时可编辑 Base URL。
- 选择官方 Provider 时只能选择注册表 Base URL。
- 配置可以无密钥保存。
- 密钥支持新增、编辑、复制、设为当前密钥、删除。
- 获取模型列表后，候选模型可写入默认模型名。
- 测试连接展示成功信息和错误摘要。
- i18n 覆盖测试包含新增文案。

验证命令：

```powershell
pnpm --filter @rolesta/api test
pnpm --filter @rolesta/web test
pnpm typecheck
```

## 参考资料

- [OpenAI Chat Completions API Reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create/)
- [Anthropic OpenAI SDK compatibility](https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/openai-sdk)
- [Z.AI API introduction](https://docs.z.ai/api-reference/introduction)
- [Z.AI OpenAI SDK guide](https://docs.z.ai/guides/develop/openai/python)
- [Z.AI Coding Plan endpoint guide](https://docs.z.ai/devpack/quick-start)
- [DeepSeek API first call](https://api-docs.deepseek.com/)
