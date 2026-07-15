# SillyTavern-Compatible Preset Manager Design

## 背景

Rolesta 需要提供 SillyTavern 兼容的预设管理系统，用于集中管理提示词编排、模型参数和预设导入导出。项目已有角色卡管理模块，后端采用 `domain / application / infrastructure / http` 分层，前端采用移动端优先的单列页面栈。预设管理应沿用这些约定，并先作为独立路由完成调试和验收，后续再嵌入 WorkspaceShell。

参考样例为 `tmp/Preset-Ako1.86-VintageNovel-4.json`。该文件包含大量 provider 专属字段、`prompts` 和多个 `prompt_order`。Rolesta 只结构化保存通用模型参数、Entry 和一条默认提示词顺序列表，完整原始输入保存在 `sourceSnapshot` 中用于排查导入差异。导出只从 Rolesta 领域模型生成 SillyTavern 兼容 JSON，不合并 `sourceSnapshot`。

## 目标

- 支持 SillyTavern 兼容预设 JSON 导入。
- 支持 SillyTavern 兼容预设 JSON 导出。
- 提供预设列表，显示预设名称。
- 支持分页和排序：创建时间、更新时间、A-Z、最近使用、最常使用。
- 支持预设新增、编辑和删除。
- 支持结构化模型参数编辑，包括上下文长度、最大回复长度、是否流式传输、temperature、penalty、topP、topK 等常用参数。
- 支持预设内 Entry 新增、编辑、删除和取消关联。
- 支持 Entry 编辑页面，字段包括名称、角色、位置和提示词。
- 支持提示词列表中的 Entry 拖拽排序、启用开关和 Token 数展示。
- 支持总 Token 数展示。
- 前端移动端优先，多级页面栈，宽屏仍单列显示。
- 使用 `gpt-tokenizer` 的 `cl100k_base` 作为当前通用 Token 计数口径。

## 非目标

- 不实现 Model Provider 关联编辑，字段预留为 `modelProviderId: null`。
- 不结构化保存 ST provider 专属字段。
- 不合并 `sourceSnapshot` 到导出结果。
- 不支持多个 `prompt_order` 的切换或编辑。
- 不把 Entry 做成跨预设复用资产。
- 不在本次工作中嵌入 WorkspaceShell。
- 不实现 model-specific Tokenizer。

## 领域模型

预设作为聚合处理。`Preset` 是聚合根，`PresetEntry` 和 `PresetPromptItem` 通过预设用例修改，保证 Entry、提示词列表和 Token 汇总一致。

```ts
export type PresetSourceFormat = 'sillytavern_preset' | 'rolesta';
export type PresetTokenizer = 'cl100k_base';
export type PresetEntryRole = 'system' | 'user' | 'assistant';
export type PresetEntryPosition = 'system' | 'chat' | 'preHistory' | 'postHistory' | 'unknown';

export interface Preset {
  id: string;
  ownerUserId: string;
  name: string;
  modelProviderId: string | null;
  modelSettings: PresetModelSettings;
  tokenizer: PresetTokenizer;
  entries: PresetEntry[];
  promptItems: PresetPromptItem[];
  tokenCount: number;
  sourceFormat: PresetSourceFormat;
  sourceSnapshot: unknown;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface PresetEntry {
  id: string;
  presetId: string;
  identifier: string;
  name: string;
  role: PresetEntryRole;
  position: PresetEntryPosition;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface PresetPromptItem {
  entryId: string;
  enabled: boolean;
  orderIndex: number;
}
```

`identifier` 用于对应 ST 的 `prompts[].identifier` 和 `prompt_order[].order[].identifier`。内部关联使用 `entryId`，避免用户编辑名称或 identifier 异常时影响 UI 和持久化关系。

总 Token 数按启用中的 `PresetPromptItem` 汇总对应 Entry 的 `tokenCount`。Entry 内容变化时重新计算 Entry Token 数，并更新预设详情响应中的总 Token 数。

## 模型参数

通用模型参数结构化保存为 `PresetModelSettings`：

```ts
export interface PresetModelSettings {
  contextLength: number | null;
  maxResponseLength: number | null;
  stream: boolean;
  temperature: number | null;
  presencePenalty: number | null;
  frequencyPenalty: number | null;
  repetitionPenalty: number | null;
  topP: number | null;
  topK: number | null;
  minP: number | null;
  topA: number | null;
  seed: number | null;
  n: number | null;
  reasoningEffort: string;
  verbosity: string;
  showThoughts: boolean;
}
```

ST 字段映射：

- `openai_max_context` -> `contextLength`
- `openai_max_tokens` -> `maxResponseLength`
- `stream_openai` -> `stream`
- `temperature` -> `temperature`
- `presence_penalty` -> `presencePenalty`
- `frequency_penalty` -> `frequencyPenalty`
- `repetition_penalty` -> `repetitionPenalty`
- `top_p` -> `topP`
- `top_k` -> `topK`
- `min_p` -> `minP`
- `top_a` -> `topA`
- `seed` -> `seed`
- `n` -> `n`
- `reasoning_effort` -> `reasoningEffort`
- `verbosity` -> `verbosity`
- `show_thoughts` -> `showThoughts`

Provider 专属字段只保存在 `sourceSnapshot`。

## Token 计数

Token 计数使用 `gpt-tokenizer` 和 `cl100k_base`。项目新增一个共享语义函数：

```ts
export function countPromptTokens(content: string): number;
```

该函数供 API 和 Web 共用。后端在导入、Entry 新增、Entry 编辑时计算并持久化 `tokenCount`。前端 Entry 编辑页使用同一函数即时显示 Token 数。预设领域对象记录 `tokenizer: "cl100k_base"`，用于说明当前 Token 数来源。

## SillyTavern 兼容映射

兼容转换集中在：

```txt
apps/api/src/presets/infrastructure/silly-tavern-preset.mapper.ts
```

导入规则：

- 输入必须是 JSON 对象。
- `name` 映射到 `Preset.name`。
- `prompts` 映射到 `PresetEntry[]`。
- `prompt_order` 优先选择 `character_id === 100000` 的 order group；不存在时选择第一个 order group。
- order 中找不到对应 prompt 的 identifier 不进入 `promptItems`。
- prompt 存在但未进入默认 order 的 Entry 仍保存到 `entries`，可在 UI 中重新添加到列表。
- 每个 Entry 导入时计算 `tokenCount`。
- 完整输入保存到 `sourceSnapshot`。

Entry 字段映射：

- `prompts[].identifier` -> `PresetEntry.identifier`
- `prompts[].name` -> `PresetEntry.name`
- `prompts[].role` -> `PresetEntry.role`
- `prompts[].content` -> `PresetEntry.content`
- `prompts[].injection_position` -> `PresetEntry.position`
- 未结构化字段进入 `PresetEntry.metadata`

导出规则：

- 从 Rolesta 领域对象生成 ST 兼容 JSON。
- 输出 `name`、结构化模型参数、`prompts` 和单个 `prompt_order`。
- `prompt_order.character_id` 固定为 `100000`。
- `prompts` 由 `entries` 生成。
- `prompt_order.order` 由 `promptItems` 按 `orderIndex` 生成。
- 不合并 `sourceSnapshot`。

## 数据库

新增三张表：

```txt
presets
  id varchar primary key
  owner_user_id varchar not null references users(id)
  name varchar not null
  model_provider_id varchar null
  model_settings_json text not null
  tokenizer varchar not null
  source_format varchar not null
  source_snapshot_json text not null
  created_at_ms integer not null
  updated_at_ms integer not null
  last_used_at_ms integer null
  usage_count integer not null

preset_entries
  id varchar primary key
  preset_id varchar not null references presets(id) on delete cascade
  identifier varchar not null
  name varchar not null
  role varchar not null
  position varchar not null
  content text not null
  token_count integer not null
  metadata_json text not null
  created_at_ms integer not null
  updated_at_ms integer not null

preset_prompt_items
  preset_id varchar not null references presets(id) on delete cascade
  entry_id varchar not null references preset_entries(id) on delete cascade
  enabled integer not null
  order_index integer not null
  primary key (preset_id, entry_id)
```

索引：

- `presets_owner_created_idx` on `(owner_user_id, created_at_ms)`
- `presets_updated_idx` on `(updated_at_ms)`
- `presets_name_idx` on `(name)`
- `presets_last_used_idx` on `(last_used_at_ms)`
- `presets_usage_count_idx` on `(usage_count)`
- `preset_entries_preset_idx` on `(preset_id)`
- `preset_entries_identifier_idx` on `(preset_id, identifier)`
- `preset_prompt_items_order_idx` on `(preset_id, order_index)`

权限按个人资产处理。预设只对 owner 可见、可编辑、可删除和可导出。

## API

接口：

```txt
GET    /presets
GET    /presets/:id
POST   /presets
PATCH  /presets/:id
DELETE /presets/:id

POST   /presets/import
GET    /presets/:id/export/sillytavern

POST   /presets/:id/entries
PATCH  /presets/:id/entries/:entryId
DELETE /presets/:id/entries/:entryId

PUT    /presets/:id/prompt-items
```

列表参数：

```ts
export interface ListPresetsQuery {
  sort?: 'createdAt' | 'updatedAt' | 'name' | 'lastUsedAt' | 'usageCount';
  direction?: 'asc' | 'desc';
  pageIndex?: number;
  pageSize?: number;
  q?: string;
}
```

行为约定：

- `POST /presets` 创建空预设，可带名称和模型参数。
- `PATCH /presets/:id` 更新名称和模型参数。
- `POST /presets/:id/entries` 新建 Entry，默认加入提示词列表。
- `PATCH /presets/:id/entries/:entryId` 更新 Entry 字段，并重新计算 Token 数。
- `DELETE /presets/:id/entries/:entryId` 删除 Entry，同时删除提示词列表中的关联。
- `PUT /presets/:id/prompt-items` 一次提交重排、启用状态和关联集合。
- `POST /presets/import` 使用 `multipart/form-data` 上传 JSON。
- `GET /presets/:id/export/sillytavern` 返回 ST 兼容 JSON。

应用层用例：

```txt
list-presets.use-case.ts
get-preset.use-case.ts
create-preset.use-case.ts
update-preset.use-case.ts
delete-preset.use-case.ts
import-preset.use-case.ts
export-preset.use-case.ts
create-preset-entry.use-case.ts
update-preset-entry.use-case.ts
delete-preset-entry.use-case.ts
update-preset-prompt-items.use-case.ts
```

## 后端结构

```txt
apps/api/src/presets/
  domain/
    preset.ts
    preset-model-settings.ts
  application/
    preset-store.ts
    preset-application-error.ts
    list-presets.use-case.ts
    get-preset.use-case.ts
    create-preset.use-case.ts
    update-preset.use-case.ts
    delete-preset.use-case.ts
    import-preset.use-case.ts
    export-preset.use-case.ts
    create-preset-entry.use-case.ts
    update-preset-entry.use-case.ts
    delete-preset-entry.use-case.ts
    update-preset-prompt-items.use-case.ts
  infrastructure/
    kysely-preset-store.ts
    silly-tavern-preset.mapper.ts
  http/
    presets.controller.ts
    preset-requests.dto.ts
    preset-responses.dto.ts
    preset-application-error.mapper.ts
```

共享 Token 函数放在 `packages/shared/src/prompt-tokenizer.ts`，并由 API 和 Web 引用。

## 前端结构

独立路由：

```txt
/app/presets
```

路由组件只负责嵌入：

```tsx
<PresetManager onBack={() => navigate('/app')} />
```

页面栈：

```ts
type PresetPage =
  | { name: 'list' }
  | { name: 'create'; sessionKey: string }
  | { name: 'editMain'; presetId: string; sessionKey: string }
  | { name: 'promptList'; presetId: string; sessionKey: string }
  | { name: 'entryCreate'; presetId: string; sessionKey: string }
  | { name: 'entryEdit'; presetId: string; entryId: string; sessionKey: string }
  | { name: 'import' };
```

组件目录：

```txt
apps/web/src/features/presets/
  api/
    presets-api.ts
  components/
    preset-manager.tsx
    preset-page-renderer.tsx
    preset-list-page.tsx
    preset-list-panel.tsx
    preset-list-item.tsx
    preset-create-page.tsx
    preset-edit-page.tsx
    preset-main-editor.tsx
    preset-prompt-list-page.tsx
    preset-prompt-list-editor.tsx
    preset-prompt-list-row.tsx
    preset-entry-create-page.tsx
    preset-entry-edit-page.tsx
    preset-entry-editor.tsx
    preset-import-page.tsx
    preset-import-panel.tsx
    preset-form-fields.tsx
  hooks/
    use-preset-draft-sessions.tsx
  model/
    preset-editor-form.ts
  routes/
    presets-page.tsx
```

UI 复用现有资产组件：

- `MobileTopBar`
- `AssetSortMenu`
- `PageControls`
- `MobileFormSection`
- `CollapsibleFieldGroup`

## 前端页面

列表页：

- 顶栏包含返回、标题“预设”、导入、新增。
- 搜索框按名称过滤。
- 排序菜单支持创建时间、更新时间、A-Z、最近使用、最常使用。
- 分页区复用 `PageControls`。
- 列表条目显示名称、总 Token、Entry 数、更新时间和使用统计。
- 列表页保持挂载，返回后保留筛选、排序、分页和滚动位置。

创建/编辑主页面：

- 顶栏显示“新增预设”或“编辑预设”。
- 字段包括名称、Model Provider 状态、模型参数折叠组、总 Token 数、提示词列表入口。
- 保存按钮固定在底部操作区。
- Model Provider 显示为未关联状态，数据保存 `modelProviderId: null`。

提示词列表页：

- 顶栏标题为“提示词列表”。
- 顶部显示总 Token 数和添加 Entry 按钮。
- Entry 行从左到右为：拖拽符号、名称、取消关联按钮、编辑按钮、开关、Token 数。
- 行内元素垂直居中。
- 拖拽排序只修改前端 draft，保存时提交。
- 取消关联只移除 prompt item，Entry 仍保存在预设内。

Entry 编辑页：

- 字段包括名称、角色、位置和提示词。
- Token 数随内容变化即时更新。
- 保存后回到提示词列表或编辑主页面。

导入页：

- 支持选择或拖放 ST 预设 JSON。
- 上传后显示导入预览：名称、Entry 数、启用 Entry 数、总 Token 数。
- 确认后创建预设。

## 拖拽交互

拖拽使用 `@dnd-kit`：

- 桌面使用 `PointerSensor`。
- 移动端使用 `TouchSensor`。
- 拖拽容器支持滚动。
- 接近容器上下边缘时自动滚动。
- 拖拽完成后更新本地 `promptItems` 顺序。
- 保存时通过 `PUT /presets/:id/prompt-items` 提交列表。

## 视觉规则

- 移动端优先，宽屏仍保持单列。
- 页面主体最大宽度对齐角色卡模块。
- 顶栏 sticky。
- 保存、导入确认等主要动作使用强调色。
- 编辑、取消关联、返回、排序、分页等操作使用中性色或图标按钮。
- 图标优先使用 `lucide-react`。
- 不使用嵌套卡片。
- 文本不能挤出按钮或行项目。

## 测试

后端单元测试：

- 导入 ST 预设映射 `name`、模型参数、`prompts`、默认 `prompt_order` 和 `sourceSnapshot`。
- 默认 order 选择优先 `character_id === 100000`，否则选择第一个。
- 未进入 order 的 prompt 仍保存在 entries。
- order 中找不到 prompt 的 identifier 不进入 prompt items。
- 导出 ST JSON 只来自领域对象。
- Entry 创建、编辑、删除会更新 Token 和列表关联。
- Prompt list 重排、启用开关和取消关联会更新总 Token。
- 列表分页和排序正确。
- 非 owner 不可读写导出。
- `cl100k_base` Token 计算有固定样例。

前端测试：

- `/app/presets` 独立渲染列表页。
- 搜索、排序、分页会刷新查询。
- 新增和编辑预设可保存名称与模型参数。
- 提示词列表行展示拖拽符号、名称、取消关联、编辑、开关和 Token 数。
- 开关和取消关联更新总 Token。
- Entry 编辑页面修改内容后 Token 即时变化。
- 页面栈返回时保留列表和草稿状态。
- 导入页可上传 ST 预设 JSON 并展示预览。
- 移动端视口下顶栏 sticky，宽屏仍单列。

端到端验收：

- 用户进入 `/app/presets`。
- 用户导入 `tmp/Preset-Ako1.86-VintageNovel-4.json`。
- 列表显示导入的预设名称。
- 编辑页显示模型参数和总 Token。
- 提示词列表显示默认 order 对应的 Entry。
- 用户可以拖拽排序、开关 Entry、取消关联和编辑 Entry。
- 保存后刷新页面，顺序、开关和内容保持一致。
- 导出 ST JSON，包含 `name`、`prompts`、`prompt_order` 和结构化模型参数。
