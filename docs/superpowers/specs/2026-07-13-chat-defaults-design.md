# 聊天默认配置与预设连接关联设计

## 背景

用户可以分别指定默认 Persona、默认预设和默认连接信息，供后续聊天功能读取。Persona 表示用户在聊天中扮演的身份角色卡，连接信息表示一条完整的 Model Provider 配置，其中包含服务地址、凭据和默认模型。

本设计同时补全预设与连接信息的关联编辑能力。聊天模块如何应用这些默认值和关联关系，将在实现聊天模块时单独设计。

## 范围

本次包含：

- 用户级默认 Persona、预设和 Model Provider 的存储、读取、设置与取消。
- 角色卡、预设和 Model Provider 详情页的默认值操作。
- 他人公开角色卡和公开预设的只读详情及默认值操作。
- 预设编辑页关联或解除关联当前用户拥有的 Model Provider。
- 默认资源删除、失去访问权限或关联 Provider 删除后的数据清理。

本次不包含创建聊天、聊天选择器、默认值应用顺序、预设关联联动、消息生成、上下文组装和消息持久化。这些内容在后续聊天模块设计中确定。

## 方案选择

新增集中式用户聊天默认配置表，每个用户一条记录，三个可空字段分别引用角色卡、预设和 Model Provider。该模型能够表达每类资源最多一个默认项，也允许用户引用他人的公开角色卡或预设。

未采用资源表中的 `is_default` 字段，因为资源级布尔值无法表达不同用户对同一个公开资源的默认选择，也难以可靠约束同类唯一默认项。未采用通用键值偏好表，因为它会削弱引用完整性和字段类型约束。

## 数据模型

新增 `user_chat_defaults` 表：

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `user_id` | varchar | 主键，引用 `users.id`，用户删除时级联删除 |
| `persona_character_id` | varchar, nullable | 引用 `characters.id`，资源删除时置空 |
| `preset_id` | varchar, nullable | 引用 `presets.id`，资源删除时置空 |
| `model_provider_id` | varchar, nullable | 引用 `model_provider_configs.id`，资源删除时置空 |
| `updated_at_ms` | integer | 最近更新时间 |

`user_id` 作为主键保证每个用户只有一份聊天默认配置。首次设置任意默认项时创建记录，后续操作更新对应字段。三个字段全部为空时允许保留记录，以简化并发更新和读取语义。

现有 `presets.model_provider_id` 应补充到 `model_provider_configs.id` 的外键约束，并使用 `ON DELETE SET NULL`。预设只能关联其所有者拥有的 Model Provider。

## 业务边界

聊天默认配置归入 `users` 模块，作为当前用户的偏好配置。该模块负责：

- 读取当前用户的三类默认配置。
- 校验角色卡和预设对当前用户可见。
- 校验 Model Provider 由当前用户拥有。
- 设置、替换或清除单类默认项。
- 返回三个默认资源 ID，供管理页判断当前资源的默认状态。

角色卡、预设和 Model Provider 的业务规则仍由各自模块维护。聊天默认配置通过清晰的查询端口验证资源可访问性，不复制各资源的可见性判断。

预设模块负责关联 Model Provider 的保存与所有权校验。公开但属于他人的预设保持只读，用户只能将其设为自己的默认预设。

## HTTP 接口

默认配置接口如下：

```http
GET    /users/me/chat-defaults
PUT    /users/me/chat-defaults/persona
DELETE /users/me/chat-defaults/persona
PUT    /users/me/chat-defaults/preset
DELETE /users/me/chat-defaults/preset
PUT    /users/me/chat-defaults/model-provider
DELETE /users/me/chat-defaults/model-provider
```

三个 `PUT` 接口接收统一结构：

```json
{
  "resourceId": "resource-id"
}
```

`GET` 返回三个可空资源 ID：

```json
{
  "personaCharacterId": null,
  "presetId": null,
  "modelProviderId": null,
  "updatedAtMs": null
}
```

用户尚未产生聊天默认配置记录时，三个资源 ID 和 `updatedAtMs` 均返回 `null`。

`PUT` 对同一资源重复调用保持幂等。`DELETE` 只清除目标类型，不影响其他默认项。设置角色卡或预设时，资源必须由当前用户拥有或处于公开状态；设置 Model Provider 时，资源必须由当前用户拥有。

预设创建和更新请求增加可空 `modelProviderId`。后端在写入前验证 Provider 所有权，`null` 表示解除关联。

## 管理页交互

角色卡、预设和 Model Provider 的已保存详情页底部增加带星标图标的次要按钮，与主保存按钮并列：

- 当前资源未设为默认时显示“设置为默认值”。
- 当前资源已设为默认时显示“取消默认值”，并呈现选中状态。
- 请求期间禁用按钮，避免重复操作。
- 点击默认值按钮只更新聊天默认配置，不提交当前编辑表单。
- 表单存在未保存修改时，修改继续保留。
- 新建页在资源首次保存前不显示默认值按钮。

他人的公开角色卡和预设使用同一详情布局，字段保持只读，隐藏保存和删除操作，保留默认值按钮。Model Provider 只能由所有者查看和设置默认值。

操作成功后刷新聊天默认配置查询缓存，各管理页中的默认标记同步更新。操作失败时保留原状态，并通过现有 Toast 展示错误。

## 预设关联连接信息

预设编辑页将现有“未关联 Model Provider”占位内容替换为连接信息选择器。候选范围为当前用户拥有的 Model Provider，并提供“无关联”选项。

`modelProviderId` 属于预设表单数据，随保存操作提交。用户修改关联后点击“设置为默认值”不会保存表单。

他人的公开预设保持只读，展示其已保存的关联状态，不允许修改关联。预设所有者的 Provider 对其他用户不可用，本次不定义该关联在聊天流程中的应用方式。

## 失效与删除处理

资源删除时由数据库外键将对应默认字段置空。Provider 删除时同时清空用户默认连接和所有预设中的 `model_provider_id`。

公开角色卡或预设转为私有后，其他用户不再拥有访问权。读取聊天默认配置时，后端清除当前用户已经失效的引用，并在响应中返回 `null`。其他仍有效的默认项不受影响。

设置默认值时若资源不存在或当前用户无权访问，接口返回资源不可用错误。预设关联的 Provider 不属于当前用户时，保存请求返回明确的权限错误。

## 测试策略

### 数据库

- 验证 `user_chat_defaults.user_id` 的唯一性。
- 验证角色卡、预设和 Provider 删除后的 `SET NULL` 行为。
- 验证 Provider 删除后预设关联字段置空。
- 验证迁移在 SQLite 方言下正确执行。

### 后端

- 设置、重复设置、替换和清除每类默认值。
- 用户可以把他人的公开角色卡或预设设为默认。
- 用户无法把他人的私有资源或 Model Provider 设为默认。
- 公开资源转为私有后的失效引用清理。
- 三类默认值互不覆盖。
- 预设关联 Model Provider 的保存、解除和所有权校验。
- HTTP 请求、响应及错误映射符合 OpenAPI 契约。

### 前端

- 默认值按钮根据当前配置切换文案和状态。
- 点击默认值按钮不会提交存在脏数据的编辑表单。
- 他人的公开详情保持只读并允许设置默认值。
- 新建页保存前不显示默认值按钮。
- 默认配置 mutation 成功后刷新共享缓存，失败后保留原状态。
- 预设关联选择器正确提交 `modelProviderId` 或 `null`。

## 验收标准

- 用户可以在三类资源的已保存详情页设置、替换和取消自己的默认项。
- 用户可以将他人的公开角色卡或预设设为默认，同时无法编辑其内容。
- 默认值操作不保存详情页中的未提交修改。
- 用户可以在自己的预设中关联或解除关联自己的 Model Provider。
- 删除或失去访问权限的资源不会继续作为可用默认项。
