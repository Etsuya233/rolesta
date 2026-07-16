# Preset 提示词模型优化设计

## 背景

Rolesta 当前将所有预设提示词和 SillyTavern marker 保存为 `PresetEntry`，`PresetPromptItem` 只能引用 Entry。领域模型需要依赖 identifier、空内容和兼容 metadata 才能识别系统占位项，尚不能稳定表达 SillyTavern Prompt Manager 的编排语义。

本阶段先优化 Preset 的领域模型、持久化、API、兼容导入导出和编辑界面。[Chat Prompt Assembling 设计](2026-07-16-chat-prompt-assembling-design.md)保留供后续实现，本阶段不开发提示词组装。

## SillyTavern 参考模型

SillyTavern 的 Chat Completion 预设由 `prompts` 和 `prompt_order` 组成。`prompts` 保存定义，`prompt_order` 保存 identifier、启用状态和顺序。列表项包含 marker、系统内置提示词、用户自定义提示词和按聊天深度注入的提示词。

marker 在生成时展开为角色描述、Persona、世界书、对话示例或聊天历史。系统内置提示词拥有实际正文且不可删除，例如 Main Prompt、Auxiliary Prompt、Post-History Instructions 和 Enhance Definitions。用户自定义提示词可以增删改。按聊天深度注入属于真实提示词的放置方式。

## 已确定模型

Preset 使用明确类型区分三类编排项：

```ts
type PresetPromptItem = PresetSlotItem | PresetSystemPromptItem | PresetCustomPromptItem;
```

- `PresetSlotItem` 表示系统定义的固定占位项，没有用户正文。
- `PresetSystemPromptItem` 表示系统定义、具有可编辑正文且不可删除的提示词。
- `PresetCustomPromptItem` 引用用户可增删改的 `PresetEntry`。

按聊天深度注入作为系统提示词或自定义提示词的放置属性。固定插槽由系统维护有限集合，每种恰好出现一次；用户可以启用、禁用和排序，不能新增或删除。

真实提示词使用以下放置模型：

```ts
type PresetPromptPlacement =
  { kind: 'relative' } | { kind: 'inChat'; depth: number; order: number };
```

Relative 提示词按预设列表顺序参与编排。In-chat 提示词插入聊天历史的指定深度，同一深度使用 `order` 决定顺序。该模型替换现有 `system`、`chat`、`preHistory`、`postHistory` 和 `unknown` 位置枚举。

以下固定插槽允许使用 Relative 或 In-chat 放置：

- `worldInfoBefore`
- `worldInfoAfter`
- `personaDescription`
- `characterDescription`
- `characterPersonality`
- `scenario`

`dialogueExamples` 和 `chatHistory` 始终使用 Relative，它们承担 Messages 结构职责，不能切换为 In-chat。

六个可配置内容插槽具有 `role: 'system' | 'user' | 'assistant'`，默认值为 `system`。`dialogueExamples` 和 `chatHistory` 内部包含多条不同角色消息，不提供统一 role。

系统内置提示词、自定义提示词和六个可配置内容插槽支持按生成类型过滤：

```ts
type PresetGenerationType =
  'normal' | 'continue' | 'impersonate' | 'swipe' | 'regenerate' | 'quiet';
```

`generationTypes` 为空时适用于全部生成类型，非空时只适用于列出的生成类型。本阶段完成导入、编辑、持久化和导出，后续 Prompt Assembling 使用该条件。

## 部分兼容导入

SillyTavern 导入按条目转换：

- 已知 marker 转换为固定插槽。
- 已知 system prompt 转换为系统内置提示词。
- `system_prompt: false` 的普通项转换为自定义提示词。
- 未知 marker 或未知 system prompt 不进入结构化预设，并产生一条预设导入问题。

导入问题包含原始 identifier、显示名称和稳定原因码，不包含任意原始对象。导入响应返回已创建的预设与导入问题列表，Web 在导入完成后展示未导入条目。完整原始文件仍保存在 `sourceSnapshot`，用于后续排查和重新解释。

导入完成后的 Preset 始终包含完整十二个系统项。文件中已有的已知项保留原顺序、启用状态和内容；缺失项使用默认定义补齐，默认禁用，并按 SillyTavern 默认相对顺序追加到列表末尾。导入结果将“未导入条目”和“已补齐项”分开返回与展示。

SillyTavern 的十二个标准 identifier 属于兼容层保留标识：

- `main`
- `nsfw`
- `jailbreak`
- `enhanceDefinitions`
- `worldInfoBefore`
- `personaDescription`
- `charDescription`
- `charPersonality`
- `scenario`
- `worldInfoAfter`
- `dialogueExamples`
- `chatHistory`

兼容适配器将这些 identifier 映射到 Rolesta 的固定插槽或系统内置提示词枚举。自定义提示词不能使用保留 identifier。

自定义提示词继续采用定义与编排分离的模型。`PresetEntry` 保存自定义提示词定义，`PresetCustomPromptItem` 引用 Entry 并保存启用状态与顺序。用户可以从编排列表移除自定义提示词并保留 Entry，之后重新加入；删除 Entry 会同步删除对应编排项。系统内置提示词和固定插槽始终留在编排列表中，不提供移除操作。

## 旧数据分类

迁移保留现有预设名称、模型设置和自定义提示词正文。使用保留 identifier 的现有条目迁移为对应固定插槽或系统内置提示词，其他条目迁移为自定义提示词。未知 `marker` 或 `system_prompt` metadata 不会导致旧条目被删除。

同一预设中重复使用保留 identifier 时，编排顺序中的第一个条目迁移为系统项，其余条目生成新的自定义 identifier 并保留内容。缺失的系统项使用默认定义补齐并禁用。

旧位置字段按以下规则迁移：

- Rolesta 自建预设的 `system`、`preHistory`、`postHistory` 和 `unknown` 转为 Relative，保留现有编排顺序。
- `chat` 转为 In-chat，缺少参数时使用 `depth: 4`、`order: 100`。
- 旧 SillyTavern 导入预设的 `preHistory` 来自 `injection_position: 1`，纠正为 In-chat，并优先读取 metadata 中的 `injection_depth` 与 `injection_order`。
- 旧 SillyTavern 导入预设的 `postHistory` 来自当前 SillyTavern 已不支持的数值 `2`，转为 Relative 并保留现有编排顺序。
- 原始兼容值继续保留在 `sourceSnapshot`。

四个系统内置提示词提供“恢复默认”操作。该操作先修改 Web 草稿，保存预设后才持久化；恢复目标是当前 Rolesta 版本内置的 SillyTavern 兼容默认正文与默认配置。应用升级不自动改写已有预设，新默认值只影响新建预设和用户主动恢复默认的结果。

系统内置提示词的名称允许编辑，并参与导入导出。“恢复默认”同时恢复名称、正文、role、placement、generationTypes 和覆盖配置。固定插槽名称由 Rolesta 按系统语义本地化展示，不允许编辑。

已确定的角色卡固定插槽包括：

- `characterDescription`
- `characterPersonality`
- `scenario`

固定插槽完整集合为：

- `worldInfoBefore`
- `personaDescription`
- `characterDescription`
- `characterPersonality`
- `scenario`
- `worldInfoAfter`
- `dialogueExamples`
- `chatHistory`

每种固定插槽在一个预设中恰好出现一次，没有用户正文，允许启用、禁用和排序，用户不能新增或删除。

系统内置提示词固定为：

- `mainPrompt`
- `auxiliaryPrompt`
- `postHistoryInstructions`
- `enhanceDefinitions`

每项系统内置提示词在一个预设中恰好出现一次，拥有可编辑正文，允许启用、禁用和排序，用户不能新增或删除。

新建预设初始化为以下默认顺序：

1. `mainPrompt`
2. `worldInfoBefore`
3. `personaDescription`
4. `characterDescription`
5. `characterPersonality`
6. `scenario`
7. `enhanceDefinitions`
8. `auxiliaryPrompt`
9. `worldInfoAfter`
10. `dialogueExamples`
11. `chatHistory`
12. `postHistoryInstructions`

`enhanceDefinitions` 默认禁用，其余项目默认启用。`mainPrompt` 和 `enhanceDefinitions` 使用 SillyTavern 默认正文，`auxiliaryPrompt` 与 `postHistoryInstructions` 初始为空。

`mainPrompt` 和 `postHistoryInstructions` 具有 `allowCharacterOverride: boolean`，默认允许角色卡覆盖。SillyTavern 导入导出在兼容边界将该字段与 `forbid_overrides` 反向映射。其他系统内置提示词不提供角色卡覆盖语义。

## 完整领域结构

最终领域结构使用可辨识联合，核心形状如下：

```ts
interface PresetEntry {
  id: string;
  presetId: string;
  identifier: string;
  name: string;
  role: PresetEntryRole;
  content: string;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAtMs: number;
  updatedAtMs: number;
}

interface PresetCustomPromptItem {
  id: string;
  kind: 'customPrompt';
  entryId: string;
  enabled: boolean;
  orderIndex: number;
}

interface PresetSystemPromptItem {
  id: string;
  kind: 'systemPrompt';
  systemPrompt: PresetSystemPrompt;
  name: string;
  role: PresetEntryRole;
  content: string;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  allowCharacterOverride?: boolean;
  tokenCount: number;
  enabled: boolean;
  orderIndex: number;
}

type PresetSlotItem = PresetContentSlotItem | PresetStructuralSlotItem;
```

内容插槽持有 role、placement 和 generationTypes。结构插槽只持有稳定 slot、启用状态和顺序。领域构造与更新规则校验系统项完整且唯一、结构插槽保持 Relative、In-chat 参数为整数、generationTypes 不重复、自定义 Entry identifier 不使用保留标识，以及自定义编排引用存在且唯一。

Preset 的静态 Token 数统计启用的系统提示词和自定义提示词正文，固定插槽记为零。角色、Persona、世界书和历史展开后的实际 Token 数属于后续 Prompt Assembling 的结果。

## 持久化

新增 `0015_preset_prompt_model` 迁移并同步 `@rolesta/db` schema。`preset_entries` 只保存自定义提示词，使用明确的 placement、In-chat depth/order 和 generation types 字段。

`preset_prompt_items` 改为带独立 ID 的统一有序表，保存：

- `kind`
- `slot_key` 或 `system_prompt_key` 或 `entry_id`
- `enabled` 与 `order_index`
- 系统提示词的 name、role、content、token count 和覆盖配置
- 内容插槽与系统提示词的 placement、In-chat depth/order 和 generation types

核心字段使用普通列，`generation_types` 使用 JSON 文本。迁移重建受影响表并在同一迁移内转换旧数据，不在运行时读取旧 schema。表级索引覆盖 `(preset_id, order_index)`、`(preset_id, kind)` 和自定义 Entry 引用。

## API

Preset 详情与整份文档更新使用 `kind` 可辨识的 prompt item DTO。固定插槽、系统内置提示词与自定义提示词分别暴露各自可编辑字段；客户端不能提交缺失、重复或额外的系统项。`PresetEntry` 请求和响应使用 `placement` 与 `generationTypes`，移除旧 `position`。

导入接口返回：

```ts
interface ImportPresetResult {
  preset: PresetDetailResponse;
  issues: PresetImportIssue[];
  supplementedItems: PresetSystemItemKey[];
}
```

接口签名变化后重新生成 OpenAPI 和 Web schema。导出继续生成 SillyTavern `prompts` 与 `prompt_order`，marker、system_prompt、injection_position、injection_depth、injection_order、injection_trigger 和 forbid_overrides 均从类型化领域字段生成。

## Web 交互

提示词列表统一展示十二个系统项和已经链接的自定义提示词，并支持拖拽和启用开关。系统项不显示取消关联或删除命令；自定义提示词保留取消关联、重新关联、编辑和删除。

系统内置提示词编辑页提供名称、role、正文、Relative / In-chat、depth、order、generation types 和适用时的角色卡覆盖开关，并提供恢复默认命令。六个内容插槽提供 role、placement 和 generation types 编辑；`dialogueExamples` 与 `chatHistory` 只允许检查、排序和启用。

导入成功后显示结果摘要，分别列出未导入条目和系统补齐项。没有导入问题或补齐项时省略对应区域。用户确认结果后进入已创建预设的编辑页。

## 非目标

- Prompt Assembling、Messages 生成和模型调用。
- 变量替换、变量目录和变量作用域。
- Chat 世界书关联。
- 执行 generationTypes 或 In-chat placement 的运行时行为。
- SillyTavern 插件提供的未知 marker 或未知 system prompt。

## 测试与验证

API 与数据库测试覆盖默认预设、三类编排项不变量、整份文档更新、静态 Token 汇总、旧数据迁移、部分导入报告、补齐规则、保留 identifier、ST 导入导出和公开预设读取。迁移测试使用已有旧 schema 数据验证正文、顺序、启用状态和模型设置没有丢失。

Web 测试覆盖三类列表行、系统项限制、自定义提示词关联、系统提示词与内容插槽编辑、In-chat 条件字段、generation types、恢复默认、导入结果和草稿保存。完成后运行受影响 workspace 的测试、typecheck、lint、OpenAPI 生成检查、根级 format check，并通过浏览器验证桌面与窄屏预设流程。

## 影响范围

- Preset 领域模型和不变量。
- SillyTavern 预设导入导出。
- 数据库 schema、迁移和 Kysely 映射。
- Preset application use case 与 HTTP DTO。
- OpenAPI 及 Web 生成类型。
- 预设提示词列表和编辑交互。
