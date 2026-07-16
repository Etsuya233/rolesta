# Chat Prompt Assembling 与 Worldbook 扫描设计

> 状态：需求对齐中。当前阶段优先补全 Worldbook 兼容模型与扫描能力，完整 Prompt Assembling 在该依赖稳定后继续。

## 背景

Rolesta 已支持角色卡、Persona、世界书、预设、模型连接和 Chat 管理。Chat 当前保存对话角色、Persona、预设和模型连接的实时关联，消息、世界书关联、模型调用与提示词组装尚未实现。

本设计以 SillyTavern 的 Chat Completion Prompt Manager、宏替换和 World Info 扫描行为为兼容参考，并保持 Rolesta 现有的领域边界与可解释上下文目标。

## 兼容基线

兼容行为绑定到 SillyTavern commit `7ffb28f753b98759bc7f3ac780e2743120023657`。对同一份角色卡、Persona、预设、世界书、聊天历史、上下文限制和 tokenizer，Rolesta 应在一对一 Chat Completion 的普通生成中输出语义等价的 Messages，并提供世界书命中、变量替换、Token 占用和历史裁剪记录。

目标范围包括：

- 角色定义、角色 Main Prompt Override 和 Post-History Instructions。
- Persona 描述。
- Preset 顺序、固定槽、自定义 Prompt 和 In-chat 注入。
- Dialogue Examples 与 Chat History。
- 世界书扫描、递归、概率、预算、定时状态和核心注入位置。
- 组装所需的宏与变量读取。
- Token 预算与历史裁剪。

当前不包含 SillyTavern 扩展、群聊、多媒体、工具调用、模型供应商后处理，以及 `continue`、`impersonate`、`quiet` 等特殊生成模式。插件自定义世界书匹配器和向量检索也不属于核心兼容范围。

## Prompt Assembly 边界

Prompt Assembly 是模型供应商无关的纯能力。调用方提供一次组装所需的完整快照；组装过程不读取数据库、不持久化消息，也不调用模型。

输入包括已确定的对话角色 Prompt View、Persona Prompt View、Preset Prompt Plan、Worldbook Scan Result、聊天历史和上下文限制。输出包括模型 Messages 和 Assembly Trace。

Assembly Trace 记录 Prompt 项来源、世界书命中、变量替换、Token 占用和历史裁剪，使生成上下文可以复查。资产读取、模型调用、流式输出和结果持久化由外层用例负责。

## 领域所有权

资产自身的运行规则留在所属领域，跨资产形成最终模型上下文的规则属于独立的 Prompt Assembly 能力。

### Characters

Characters 提供对话角色和 Persona 的窄 Prompt View。对话角色 View 包含名称、描述、性格、场景、示例对话、Prompt Override 和内嵌世界书定义；Persona View 包含用户名称、Persona 描述和内嵌世界书定义。

### Presets

Presets 负责解释 Preset 自身的运行规则，包括启用状态、顺序、generation types、placement 和角色覆盖许可。`PresetPromptPlanner` 输出仍含固定槽的 `PresetPromptPlan`，不展开角色、Persona、世界书或聊天历史。

概念模型如下：

```ts
type PresetPromptPlanItem =
  | { kind: 'content'; role: PromptRole; content: string }
  | { kind: 'slot'; slot: PresetSlot; role?: PromptRole }
  | { kind: 'inChat'; role: PromptRole; content: string; depth: number; order: number };
```

### Worldbooks

Worldbooks 负责世界书类型、兼容转换和扫描规则。`WorldbookScanner` 接收与 Chat 类型无关的 `WorldbookScanContext`，执行激活、递归、概率、预算、分组竞争和注入位置计算，返回 `WorldbookScanResult`。

`WorldbookRuntimeState` 的语义由 Worldbooks 定义，用于表达 sticky、cooldown 和 delay 等跨轮次效果。具体 Chat 持有该状态的生命周期；当前阶段只设计扫描输入与输出，不增加状态持久化。

运行时状态通过 `WorldbookEntryRef` 绑定条目。该引用由来源类型、来源资产 ID 和 Entry ID 组成，避免独立世界书与角色卡内嵌世界书之间发生身份冲突。每份条目状态还保存其扫描字段指纹；当前条目的指纹与状态不一致时，扫描器丢弃旧状态，使编辑后的 Entry 不继承先前的 sticky 或 cooldown。

扫描器不区分普通运行和 dry run，也不修改输入的 `WorldbookRuntimeState`。每次扫描统一返回根据本次结果计算出的 `nextRuntimeState`，表示调用方接纳本次扫描后应使用的下一份状态。Generation Debug 丢弃该状态；Chat 应用层决定何时接纳和保存，具体持久化时机留到 Chat Message 生命周期设计时确定。

sticky 和 cooldown 使用 `historyMessageCount` 作为状态时钟。每条进入权威聊天历史的用户消息或角色消息都使计数增加 1；重新生成期间历史消息数量没有增加时，计时不前进。该规则与兼容基线中按聊天数组长度推进 timed effects 的行为一致。

概率激活和分组竞争使用调用方显式提供的 `WorldbookScanRandom`，扫描器不直接读取全局随机源。测试可以提供固定随机序列；实际生成由 Chat 应用层提供随机源。扫描 Trace 记录每次抽样的用途、取值和结果，因此相同扫描上下文与相同随机序列可以稳定复现。

Worldbooks 还拥有用户级 `WorldbookScanPreferences`。它保存用户选择的默认扫描偏好；Worldbooks 根据内置默认值和已保存偏好产生一次扫描使用的完整 `WorldbookScanSettings` 快照。该偏好不属于单本 Worldbook、Preset 或 Chat Preferences。

Entry 仍可通过 nullable 字段覆盖允许逐条调整的设置，例如扫描深度、大小写匹配和整词匹配。Chat 和 Prompt Assembly 只消费已经确定的 `WorldbookScanSettings` 快照，不解释偏好或默认值。

用户级扫描偏好覆盖所有会改变核心扫描结果的 ST 全局选项，默认值固定为兼容基线版本的行为：

```ts
interface WorldbookScanPreferences {
  scanDepth: 2;
  minActivations: 0;
  minActivationsDepthMax: 0;
  budgetPercent: 25;
  budgetCap: 0;
  recursive: false;
  caseSensitive: false;
  matchWholeWords: false;
  useGroupScoring: false;
  maxRecursionSteps: 0;
  includeNames: true;
  characterLoreInsertionStrategy: 'characterFirst';
}
```

`overflowAlert` 只控制用户界面提示，不进入扫描领域模型。

本阶段提供用户级 Worldbook Scan Preferences 编辑页。入口为世界书列表顶部工具栏中的设置按钮，页面读取和保存 Worldbooks 所拥有的用户偏好；单本世界书编辑器不再展示扫描深度、预算或全局递归设置。

#### Worldbook Entry 兼容范围

类型化 Worldbook Entry 覆盖固定兼容基线中所有会影响核心扫描结果的字段：

- 激活与预算：`constant`、`ignoreBudget`、`probability`、`useProbability`。
- 关键词匹配：主关键词、可选关键词、selective logic，以及可继承的 `caseSensitive` 和 `matchWholeWords`。
- 扫描来源：Persona 描述、角色描述、角色性格、角色 depth prompt、场景和 Creator Notes 的逐项匹配开关。
- 递归：Entry 扫描深度、排除递归、防止递归和数值型递归延迟层级。
- 分组竞争：group、group override、group weight，以及可继承的 group scoring。
- 定时效果：sticky、cooldown 和 delay。
- 过滤与触发：角色名称过滤、角色标签过滤、排除模式和 generation type triggers。
- 注入：position、order、role、depth 和 outlet/anchor 名称。

`@@activate` 和 `@@dont_activate` 作为世界书激活装饰器直接写在 Entry 内容中。扫描器从内容读取装饰器，不在 Entry 上保存另一份可变 decorators 字段。

`vectorized` 保留在类型化模型和 SillyTavern 导入导出中；当前核心扫描器不执行向量检索或向量激活。

`automationId` 仅作为 Quick Reply 扩展使用的兼容元数据保留，当前扫描器不执行对应自动化。`addMemo` 仅表示 SillyTavern 编辑器是否展示 memo/comment 输入，也作为兼容元数据保留，不参与扫描。两者均不扩大当前的扩展兼容范围。

本阶段的 Web 编辑器开放所有影响核心扫描结果的 Entry 字段。可继承的布尔设置使用“跟随用户偏好 / 开启 / 关闭”三态编辑。`vectorized`、`automationId` 和 `addMemo` 只参与持久化与 SillyTavern 导入导出，暂不提供编辑控件。

### Prompt Assembly

Prompt Assembly 消费 Character Prompt View、Persona Prompt View、Preset Prompt Plan、Worldbook Scan Result 和聊天历史，完成固定槽展开、In-chat 插入、宏求值、Token 预算与最终 Messages 生成。

Prompt Assembly 形成独立能力，因为 Chat 生成和 Generation Debug 都需要同一套组装结果与解释记录。

### Chats

Chats 负责一次具体对话意图的编排。Chat 保存资产身份的实时引用；每次组装由 Chat 应用用例读取当前资产，建立本轮不可变快照，再调用 Presets、Worldbooks 和 Prompt Assembly 的公开 contract。

依赖方向如下：

```text
chats/application
  -> prompt-assembly
  -> characters/contracts
  -> presets/contracts
  -> worldbooks/contracts
  -> model-profiles/contracts

generation-debug
  -> prompt-assembly
```

Chat 不调用其他模块的 Store，也不导入其 persistence。各模块通过面向组装场景的窄 contract 提供数据或能力。

## Chat 历史输入

当前 Chat 尚无 Message 领域模型、消息表或消息读写用例。本阶段不引入 Chat Message 持久化。

组装命令携带一次不可变的 `PromptHistoryMessage[]` 快照。未来生成用例负责从权威消息存储加载历史，再把同一形状的快照交给 Prompt Assembly。

## 世界书来源

当前 Chat 尚无世界书关联。组装命令携带有序的 `worldbookIds: string[]`，外层用例读取用户可见的独立世界书。

对话角色和 Persona 的内嵌世界书自动参与扫描。内嵌 `character_book` 先在 Worldbooks 兼容边界转换成统一类型，扫描器不解析 SillyTavern 原始对象。对话角色与 Persona 引用同一张角色卡时，同一个内嵌世界书只加入一次。

角色卡当前继续以原始 `characterBook` JSON 保存内嵌世界书。本阶段由 Worldbooks 兼容边界完成类型化转换、扫描校验和 SillyTavern 兼容测试，不改造 Characters 的持久化模型，也不增加角色卡内嵌世界书编辑器。

本阶段不增加 Chat 世界书关联表和选择界面。

## 当前阶段：Worldbook 补全

Prompt Assembly 依赖完整且可验证的世界书扫描结果。当前阶段集中完成：

- 补齐会影响核心扫描行为的类型化 Worldbook 和 Worldbook Entry 字段。
- 从单本 Worldbook 移除 `scanDepth`、`tokenBudget` 和 `recursiveScan`，由用户级 Worldbook Scan Preferences 接管对应运行设置。
- 同步数据库迁移、API、Web 编辑器和 SillyTavern 导入导出。
- 建立独立的 `WorldbookScanSettings`，表达扫描深度、预算、递归、匹配继承、分组评分和递归限制等运行设置。
- 将独立世界书与角色卡内嵌世界书转换成统一内部模型。
- 实现纯 `WorldbookScanner`，输出激活条目、各注入区域、扫描 Trace 和下一份 `WorldbookRuntimeState`。
- 使用固定 SillyTavern 版本建立差异测试。

完整 Preset 展开、宏系统、Token 历史裁剪和最终 Messages 组装在 Worldbook 扫描能力稳定后继续。

本阶段不实现 Generation Debug 的 HTTP 契约、持久化、页面或集成，也不提供独立的世界书扫描预览界面。Worldbook Scanner 仍输出结构化扫描 Trace，供差异测试验证并作为后续 Generation Debug 接入的稳定领域结果。

## 已确认决策

- ST 兼容基线固定为 `7ffb28f753b98759bc7f3ac780e2743120023657` 的一对一普通 Chat Completion。
- Prompt Assembly 保持纯能力；Chat 应用层负责读取资产和编排调用。
- 本阶段不引入 Chat Message 持久化。
- 独立世界书 ID 和历史快照由组装命令提供。
- 角色与 Persona 的内嵌世界书自动参与扫描并使用统一类型。
- Worldbook Scanner 属于 Worldbooks；Preset Prompt Planner 属于 Presets；跨资产 Messages 组装属于 Prompt Assembly。
- Worldbook Runtime State 的语义属于 Worldbooks，生命周期属于具体 Chat。
- Worldbook Scan Preferences 是 Worldbooks 拥有的用户级默认偏好；每次扫描使用完整的 Worldbook Scan Settings 快照。
- 单本 Worldbook 不再保存 `scanDepth`、`tokenBudget` 和 `recursiveScan`。现有值不迁移到用户偏好，新的用户偏好从领域默认值开始。
- Worldbook Entry 补齐所有影响核心关键词扫描、来源匹配、递归、概率、预算、分组、过滤、定时状态、触发与注入的字段。
- `@@activate` 和 `@@dont_activate` 从 Entry 内容读取；`vectorized`、`automationId` 和 `addMemo` 保留兼容数据，但当前不提供向量检索、Quick Reply 自动化或 `addMemo` 扫描行为。
- Web 编辑器开放全部核心扫描字段；`vectorized`、`automationId` 和 `addMemo` 暂不提供编辑控件。
- 概率激活和分组竞争使用显式 `WorldbookScanRandom`；扫描 Trace 记录每次随机抽样，扫描器不直接调用全局随机源。
- Worldbook Runtime State 使用 `WorldbookEntryRef` 绑定来源和 Entry，并通过扫描字段指纹使已编辑条目的旧状态失效。
- Worldbook Scanner 不设置 dry-run 分支；每次统一返回 `nextRuntimeState`，由 Generation Debug 丢弃或由 Chat 应用层接纳。
- sticky 和 cooldown 按 `historyMessageCount` 推进，每条用户或角色历史消息计为 1。
- 本阶段提供用户级 Worldbook Scan Preferences 编辑页，入口位于世界书列表工具栏。
- 角色卡内嵌世界书在扫描时转换为统一类型；本阶段不增加内嵌世界书编辑器或改造 Characters 持久化模型。
- 本阶段不实现 Generation Debug 或用户可见的扫描预览，只交付 Scanner 的结构化扫描 Trace 与差异测试。

## 待确定事项

- Worldbook Runtime State 在未来消息模型中的持久化边界。
- 变量语法、变量目录、求值阶段、作用域和副作用边界。
- Token 预算分配、必选内容和历史裁剪策略。
- Assembly Result 与调试记录的稳定 HTTP 契约。
