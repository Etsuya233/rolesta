# Worldbook Editor Compatibility Design

## 目标

优化世界书条目编辑页，让 Rolesta 能编辑并保存 SillyTavern 世界书常用字段。字段命名使用 Rolesta 语义，导入导出层负责和 SillyTavern JSON 字段互相映射。

本次覆盖领域模型、数据库、API、导入导出和前端编辑体验。聊天运行时匹配、递归激活、组评分、粘性、冷却、生成触发器、向量化和自动化执行逻辑留到聊天模块或后续专门迭代。

参考输入：

- 截图中的 SillyTavern 世界书条目编辑页。
- `tmp/世界书.json` 中的条目字段集合。
- `D:\programming\SillyTavern\public\scripts\world-info.js` 中的 `world_info_position`、`world_info_logic`、`newWorldInfoEntryDefinition` 和导入兼容映射。
- `D:\programming\SillyTavern\public\index.html` 中的世界书条目编辑模板。

## 当前样例字段

`tmp/世界书.json` 的条目出现了这些字段：

`addMemo`, `automationId`, `caseSensitive`, `characterFilter`, `comment`, `constant`, `content`, `cooldown`, `delay`, `delayUntilRecursion`, `depth`, `disable`, `displayIndex`, `excludeRecursion`, `group`, `groupOverride`, `groupWeight`, `ignoreBudget`, `key`, `keysecondary`, `matchCharacterDepthPrompt`, `matchCharacterDescription`, `matchCharacterPersonality`, `matchCreatorNotes`, `matchPersonaDescription`, `matchScenario`, `matchWholeWords`, `order`, `outletName`, `position`, `preventRecursion`, `probability`, `role`, `scanDepth`, `selective`, `selectiveLogic`, `sticky`, `triggers`, `uid`, `useGroupScoring`, `useProbability`, `vectorized`.

截图额外确认了这些编辑区：名称、条目启用状态、插入位置、深度、顺序、触发百分比、主要关键字、可选过滤器、逻辑、扫描深度、区分大小写、完整单词、组评分、自动化 ID、递归控制、内容、UID、包含组、组权重、粘性、冷却、延迟、确定优先级、角色或标签绑定、排除、筛选生成触发器。

## 本次结构化字段

下面字段本次进入 `WorldbookEntry`、数据库表、API 请求响应、导入导出和编辑表单。它们都来自 SillyTavern 当前字段表或截图中可见编辑项：

- `externalUid`: SillyTavern `uid`，可为空。
- `enabled`: 由 SillyTavern `disable` 反向映射。
- `name`: Rolesta 条目名称，导入时取 `name`、`comment` 或显式生成名称。
- `addMemo`: SillyTavern `addMemo`。
- `comment`: SillyTavern `comment`。
- `content`: SillyTavern `content`。
- `primaryKeys`: SillyTavern `key`。
- `secondaryKeys`: SillyTavern `keysecondary`。
- `conditionLogic`: SillyTavern `selectiveLogic`，支持 `andAny`, `notAll`, `notAny`, `andAll`。
- `selective`: SillyTavern `selective`。
- `constant`: SillyTavern `constant`。
- `vectorized`: SillyTavern `vectorized`。
- `caseSensitive`: SillyTavern `caseSensitive`，支持跟随全局、启用、关闭。
- `matchWholeWords`: SillyTavern `matchWholeWords`，支持跟随全局、启用、关闭。
- `insertionPosition`: SillyTavern `position`。
- `depthRole`: SillyTavern `role`，支持 `system`, `user`, `assistant`。
- `insertionDepth`: SillyTavern `depth`。
- `insertionOrder`: SillyTavern `order`。
- `displayOrder`: SillyTavern `displayIndex`，用于列表排序。
- `useProbability`: SillyTavern `useProbability`。
- `probability`: SillyTavern `probability`。
- `scanDepth`: SillyTavern `scanDepth`，可为空，空值表示使用世界书全局扫描深度。
- `recursiveScan`: 由 SillyTavern `excludeRecursion` 反向映射。
- `preventFurtherRecursion`: SillyTavern `preventRecursion`。
- `delayUntilRecursion`: SillyTavern `delayUntilRecursion`。
- `recursionDelayLevel`: 从 SillyTavern `delayUntilRecursion` 的数字值拆出；为空时只表示启用递归延迟。
- `ignoreBudget`: SillyTavern `ignoreBudget`。
- `group`: SillyTavern `group`。
- `groupOverride`: SillyTavern `groupOverride`。
- `groupWeight`: SillyTavern `groupWeight`。
- `useGroupScoring`: SillyTavern `useGroupScoring`，支持跟随全局、启用、关闭。
- `sticky`: SillyTavern `sticky`。
- `cooldown`: SillyTavern `cooldown`。
- `delay`: SillyTavern `delay`。
- `matchPersonaDescription`: SillyTavern `matchPersonaDescription`。
- `matchCharacterDescription`: SillyTavern `matchCharacterDescription`。
- `matchCharacterPersonality`: SillyTavern `matchCharacterPersonality`。
- `matchScenario`: SillyTavern `matchScenario`。
- `matchCreatorNotes`: SillyTavern `matchCreatorNotes`。
- `matchCharacterDepthPrompt`: SillyTavern `matchCharacterDepthPrompt`。
- `automationId`: SillyTavern `automationId`。
- `generationTriggers`: SillyTavern `triggers`，支持 `normal`, `continue`, `impersonate`, `swipe`, `regenerate`, `quiet`。
- `outletName`: SillyTavern `outletName`。
- `characterFilter`: SillyTavern `characterFilter`，结构为 `{ isExclude, names, tags }`。

`caseSensitive`、`matchWholeWords`、`useGroupScoring` 需要使用三态枚举。样例里这些字段存在 `null`，直接压成 boolean 会丢信息。

`delayUntilRecursion` 在 SillyTavern 中既可以是 boolean，也可以是数字递归层级。Rolesta 建模时拆成 `delayUntilRecursion` 和 `recursionDelayLevel` 更清晰；导入导出时映射回同一个 SillyTavern 字段。

## 后续复杂编辑

下面字段本次先不做完整资产选择器。导入时应结构化保存最小数据，编辑页可以先使用轻量输入；后续再换成专门选择器：

- `characterFilter`: SillyTavern 结构为 `{ isExclude, names, tags }`。本次保存结构，UI 先用名称/标签文本输入或简单 JSON 编辑，角色资产选择器和标签选择器后续再做。

下面行为本次不实现：

- `automationId` 自动激活 Quick Replies。
- `generationTriggers` 对聊天生成类型的真实过滤。
- `outletName` 对 `{{outlet::name}}` 宏的提示词注入。
- `vectorized` 对检索索引的影响。
- `characterFilter` 对角色或标签的真实匹配。

实现时不要为这些后续交互新增无意义的承载类，也不要写防御性兜底逻辑。

## 插入位置

扩展 `WorldbookInsertionPosition`，覆盖截图和样例中可见的 SillyTavern 位置：

- `beforeCharacterDefinition`: 角色定义之前，映射 `position: 0`。
- `afterCharacterDefinition`: 角色定义之后，映射 `position: 1`。
- `beforeAuthorNote`: 作者注释之前，映射 `position: 2`。
- `afterAuthorNote`: 作者注释之后，映射 `position: 3`。
- `atDepth`: 按深度插入，映射 `position: 4`，并使用 `depthRole` 表示系统、用户、AI。
- `beforeExampleMessages`: 示例消息之前，映射 `position: 5`。
- `afterExampleMessages`: 示例消息之后，映射 `position: 6`。
- `outlet`: 作为 outlet 收集，映射 `position: 7`，配合 `outletName`。
- `unknown`: 未识别位置。

ST 源码确认 `depthRole` 数值为 `system: 0`, `user: 1`, `assistant: 2`。

## 枚举映射

`conditionLogic` 映射 SillyTavern `world_info_logic`：

- `andAny`: `AND_ANY`, value `0`。
- `notAll`: `NOT_ALL`, value `1`。
- `notAny`: `NOT_ANY`, value `2`。
- `andAll`: `AND_ALL`, value `3`。

`generationTriggers` 映射 SillyTavern `GENERATION_TYPE_TRIGGERS`：

- `normal`
- `continue`
- `impersonate`
- `swipe`
- `regenerate`
- `quiet`

## 编辑页布局

条目编辑页改为分区表单，去掉开关式控件。所有布尔或三态字段使用 select。

基础：名称、启用状态、条目状态、UID、内容、token 数。

匹配条件：主要关键字、可选过滤器、条件逻辑、选择性、区分大小写、完整单词、扫描深度、匹配范围字段。

插入：插入位置、深度角色、深度、顺序、显示顺序、触发百分比、是否使用触发百分比、outlet 名称、忽略预算。

递归：是否可被递归激活、防止进一步递归、延迟到递归、递归延迟层级。

分组：包含组、组评分、组权重、确定优先级。

时序：粘性、冷却、延迟。

过滤：角色/标签过滤、排除模式、生成触发器过滤。

备注：comment。

关键字输入框使用紧凑 textarea。内容输入框保留主要编辑空间。页面可以使用分割线、空行或现有表单分组组件进行区分，不需要强制折叠。

## 导入导出

导入时从 SillyTavern JSON 读取上述结构化字段。缺失字段使用创建时明确默认值。`null` 值按字段语义保留，例如三态字段和可空扫描深度。

导出时写回 SillyTavern 字段名。当前已经结构化的字段需要参与导出。尚未结构化的字段不伪造值。

现有导入导出测试需要扩展，覆盖：

- 三态字段的 null round-trip。
- `uid`、`displayIndex`、`order` 分别映射。
- `position: 2` 和 `position: 3` 的作者注释前后插入。
- `position: 4` 加 `role` 的深度插入。
- `position: 7` 加 `outletName` 的 outlet 插入。
- 递归字段、分组字段、时序字段。
- `delayUntilRecursion` 的 boolean 和数字层级映射。
- 匹配范围字段。
- 条目状态中的 `constant`、`vectorized`、普通状态。
- `automationId` 和 `generationTriggers` round-trip。
- `characterFilter` 的 include/exclude、角色名和标签 id round-trip。

## 验证

前端继续要求名称非空。后端 DTO 需要对数字字段设定清晰范围：

- `probability`: 0 到 100。
- `insertionDepth`: 0 到 9999。
- `scanDepth`: 0 到 1000，允许 null。
- `sticky`, `cooldown`, `delay`: 0 或更大，允许 null。
- `recursionDelayLevel`: 1 或更大，允许 null。
- `groupWeight`: 1 或更大。
- `insertionOrder`, `displayOrder`, `externalUid`: 整数。

字段默认值在创建用例和导入映射里显式给出。不要依赖隐式兜底。

## 测试

更新后端用例测试、SillyTavern mapper 测试、OpenAPI 生成类型相关检查和前端类型检查。

本次不实现聊天运行时，不增加世界书命中预览，不解释这些字段在聊天生成中的真实效果。
