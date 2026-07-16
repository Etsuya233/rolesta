# Chat Prompt Assembling 设计

> 当前阶段调整：先完成 Preset 编排模型优化，Prompt Assembling 的实现延期。本文已经确定的组装边界和资产规则保留为后续设计输入。

## 背景

Rolesta 已支持角色卡、Persona、世界书、预设、模型连接和 Chat 管理。Chat 当前保存对话角色、Persona、预设和模型连接的实时关联，消息、世界书关联、模型调用与提示词组装尚未实现。

本设计参考 SillyTavern 的 Prompt Manager、宏替换和 World Info 扫描行为，选择适合 Rolesta 当前产品边界的语义，不以逐项复刻 SillyTavern 为目标。

## SillyTavern 预设编排参考

本设计参考 SillyTavern `8172dcd` 的 `public/scripts/PromptManager.js` 与 `public/scripts/openai.js`。SillyTavern 的 Chat Completion 预设使用两组数据：`prompts` 保存提示词定义，`prompt_order` 保存 identifier、启用状态和顺序。Prompt Manager 根据当前顺序选择启用项，再在生成时展开运行时内容。

SillyTavern 的列表项具有四类行为：

- marker：没有固定正文，在运行时展开为角色描述、Persona、世界书、对话示例或聊天历史。
- system prompt：系统提供且不可删除的可编辑提示词，例如 Main Prompt、Auxiliary Prompt、Post-History Instructions 和 Enhance Definitions。
- preset prompt：用户创建、可编辑和可删除的普通提示词。
- in-chat injection：按深度和同深度顺序插入聊天历史的提示词。

默认 marker 包括 `worldInfoBefore`、`worldInfoAfter`、`charDescription`、`charPersonality`、`scenario`、`personaDescription`、`dialogueExamples` 和 `chatHistory`。默认顺序为 Main Prompt、World Info Before、Persona、角色描述、角色性格、场景、Enhance Definitions、Auxiliary Prompt、World Info After、对话示例、聊天历史和 Post-History Instructions。

生成时，SillyTavern 先按 `prompt_order` 取得启用项并替换宏，再用当前角色、Persona、世界书和历史替换 marker。角色卡 `system_prompt` 可以覆盖 Main Prompt，`post_history_instructions` 可以覆盖 Post-History Instructions；目标提示词声明禁止覆盖时保留预设内容。普通相对提示词按列表顺序进入 Messages，in-chat injection 按深度插入历史。最后在 Token 预算内从近到远加入聊天历史和对话示例。

SillyTavern 依赖 `identifier`、`marker`、`system_prompt` 和数值位置字段表达这些类别。Rolesta 会在兼容适配器中识别这些字段，并在领域模型中使用明确类型保存相同语义。

## 已确定边界

提示词组装是模型供应商无关的纯能力。调用方负责提供一次组装所需的完整输入，组装过程不读取数据库，不持久化消息，也不调用模型。

输入包括已确定的对话角色、Persona、预设、世界书、聊天历史和上下文限制。输出包括模型消息，以及命中的世界书条目、变量替换、Token 占用和历史裁剪等可解释记录。资产读取、生成编排、模型调用、流式输出与结果持久化由其他能力负责。

## Chat 世界书模型

Chat 的目标模型允许关联零到多本独立世界书。关联是有序的实时资产引用，同一本世界书在一个 Chat 中只出现一次；顺序用于条目优先级相同时的稳定裁决，并允许用户明确调整上下文来源顺序。

概念模型如下：

```ts
interface ChatWorldbookReference {
  worldbookId: string;
  orderIndex: number;
}
```

本阶段只定义该模型。Chat 的数据库结构、HTTP 契约、管理界面与资产生命周期处理暂不增加世界书关联；提示词组装通过调用方提供的世界书集合工作，不依赖 Chat 已经持久化这些引用。

## 对话角色内嵌世界书

对话角色的内嵌世界书属于角色定义的一部分，随对话角色自动参与提示词组装，无需用户将其再次添加为 Chat 世界书关联。

提示词组装只接收 Rolesta 内部的类型化世界书表示，不解析角色卡中的 SillyTavern `character_book` 原始对象。角色卡兼容适配器或资产读取边界负责将内嵌世界书转换成组装器需要的内部输入。

## Persona 内嵌世界书

Persona 的内嵌世界书也随 Persona 自动参与提示词组装。Persona 与对话角色引用同一张角色卡时，同一个内嵌世界书只参与一次，避免重复匹配和注入。

## 预设编排模型

Preset 领域模型显式区分固定插槽和自定义提示词。`PresetEntry` 只表示具有实际角色与内容的可编辑提示词；有序的 `PresetPromptItem` 使用可辨识联合表示固定插槽或对 `PresetEntry` 的引用。

概念模型如下：

```ts
type PresetPromptItem =
  | {
      kind: 'slot';
      slot: PresetPromptSlot;
      enabled: boolean;
      orderIndex: number;
    }
  | {
      kind: 'entry';
      entryId: string;
      enabled: boolean;
      orderIndex: number;
    };
```

SillyTavern 的 marker 与保留 identifier 在兼容适配器中转换成固定插槽。提示词组装只读取类型化的 `kind` 和 `slot`，不通过 `metadata.marker`、空内容或 identifier 猜测领域语义。

固定插槽由系统定义为有限集合。每个预设中的每种固定插槽至多出现一次，用户可以启用、禁用和调整顺序，不能新增或删除固定插槽。自定义提示词继续通过 `PresetEntry` 增删改，并通过 `kind: 'entry'` 的编排项加入顺序列表。

角色卡基础定义使用三个独立固定插槽：

- `characterDescription`
- `characterPersonality`
- `scenario`

三个插槽分别展开角色卡的 `description`、`personality` 和 `scenario` 字段，允许预设独立启用、禁用和排序，并保留 SillyTavern 预设的对应 marker 语义。

## 待确定事项

- 固定插槽集合及各插槽的展开语义。
- 世界书扫描范围、匹配、递归、概率、预算和插入语义。
- 变量语法、变量目录、求值阶段、作用域和副作用边界。
- Token 预算分配、必选内容和历史裁剪策略。
- 组装结果与调试记录的稳定契约。
