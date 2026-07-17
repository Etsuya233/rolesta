# Rolesta 领域语言

本文档统一 Rolesta 产品与代码讨论中的领域术语，避免同一概念使用多套名称。

## 聊天

**聊天会话（Chat）**：
用户拥有的一对一角色扮演对话容器，持有用于后续回复的当前对话角色。当前对话角色更换或关联被系统移除时，会话与已有消息继续存在；聊天会话还可关联 Persona、预设和模型连接。
_避免使用_：对话、聊天记录

**对话角色（Chat Character）**：
聊天会话中由系统扮演且用于后续回复的当前角色，由一张用户可访问的角色卡定义。更换对话角色不会改变已有消息的作者归属。
_避免使用_：AI 角色、Bot

**缺少对话角色（Missing Chat Character）**：
聊天会话因当前对话角色被删除或失去可访问性而进入的状态。用户仍可查看和管理会话，但在重新选择对话角色前无法继续产生角色回复。
_避免使用_：无角色聊天

**实时资产关联（Live Asset Reference）**：
聊天会话对当前角色卡、Persona、预设和模型连接的关联语义。资产内容的后续修改会影响会话未来的使用结果，已有消息和历史生成依据保持原样。
_避免使用_：资产快照、固定版本

**Persona**：
聊天会话中代表用户后续消息身份的当前角色卡，可以从用户自己的角色卡或其他用户当前公开的角色卡中选择。更换、清空、删除或失去当前 Persona 的访问权不会改变已有消息的 Persona 归属。
_避免使用_：用户角色、玩家角色

**提示词组装（Prompt Assembly）**：
根据一次生成已经确定的角色、Persona、预设、世界书、聊天历史和上下文限制，产生模型消息及其可解释记录的过程。
_避免使用_：Prompt 拼接、上下文拼接

**Chat 世界书关联（Chat Worldbook Reference）**：
聊天会话对零到多本独立世界书的有序实时关联，表示后续提示词组装可以使用的世界书集合。
_避免使用_：全局世界书、默认世界书

**内嵌世界书（Embedded Worldbook）**：
角色卡自身携带且随角色卡共同使用的世界书。对话角色和 Persona 的内嵌世界书自动参与后续提示词组装，无需建立 Chat 世界书关联。
_避免使用_：角色默认世界书、角色绑定世界书

**预设固定插槽（Preset Prompt Slot）**：
预设编排中由提示词组装填入角色、Persona、世界书、示例消息或聊天历史内容的有序占位项。
_避免使用_：系统提示词、空 Entry、marker

**预设导入问题（Preset Import Issue）**：
预设兼容导入中无法转换为 Rolesta 领域模型的单个条目及其明确原因。存在导入问题时，其他受支持条目仍可完成导入。
_避免使用_：导入失败、兼容警告

## 生成上下文

**Prompt View**：
资产领域面向提示词组装提供的只读语义投影，只包含形成生成上下文所需的信息。
_避免使用_：Asset DTO、完整聚合

**Preset Prompt Plan**：
预设根据自身启用、顺序、生成类型、放置和覆盖规则形成的有序计划，其中固定插槽仍等待运行时内容展开。
_避免使用_：Rendered Preset、Messages

**组装追踪（Assembly Trace）**：
解释最终模型消息来源、世界书命中、变量替换、Token 占用和历史裁剪的记录。
_避免使用_：Debug Log、Request Log

## 世界书扫描

**世界书扫描（Worldbook Scan）**：
根据扫描上下文和世界书规则确定激活条目及其注入位置的过程。
_避免使用_：Lore Search、Worldbook Assembly

**世界书扫描上下文（Worldbook Scan Context）**：
一次世界书扫描可观察的历史、角色、Persona、生成类型、运行设置和既有状态快照。
_避免使用_：Chat Context、Request Context

**世界书扫描偏好（Worldbook Scan Preferences）**：
用户为后续世界书扫描保存的默认行为选择，由世界书领域拥有。
_避免使用_：Chat Preferences、Worldbook Defaults

**世界书扫描设置（Worldbook Scan Settings）**：
一次世界书扫描实际使用的完整设置快照，已经包含领域默认值和用户偏好。
_避免使用_：Worldbook Config、Scan Preferences

**世界书运行时状态（Worldbook Runtime State）**：
隶属于具体聊天会话、用于延续世界书跨轮次效果的状态，例如 sticky、cooldown 和 delay。
_避免使用_：Worldbook Settings、Scan Cache

**世界书激活装饰器（Worldbook Activation Decorator）**：
写在世界书条目内容中的控制标记，用于强制激活或禁止激活该条目。装饰器属于内容表达的一部分，不作为可独立编辑的条目属性。
_避免使用_：Activation Field、Decorator List

**世界书扫描随机源（Worldbook Scan Random）**：
一次世界书扫描用于概率激活和分组竞争的显式随机输入。相同扫描上下文与相同随机序列产生相同扫描结果。
_避免使用_：Global Random、Scanner Seed

**世界书条目引用（Worldbook Entry Ref）**：
世界书运行时状态引用具体条目的稳定身份，由来源类型、来源资产身份和条目身份共同确定。
_避免使用_：Entry Key、Worldbook UID
