# Character Card Manager Design

## 背景

Rolesta 需要提供一个 SillyTavern 兼容的角色卡管理模块。该模块是资产管理能力的第一条完整链路，需要支持导入、编辑、管理、分页列表、权限控制和导出。前端先作为独立调试入口交付，后续会嵌入 WorkspaceShell，因此核心 UI 需要设计成无 URL 路由依赖的可嵌套组件。

## 目标

- 支持 SillyTavern V1、V2、V3 JSON 角色卡导入。
- 支持 SillyTavern PNG metadata 角色卡导入，头像图片内容先忽略。
- 支持导出 SillyTavern 兼容 JSON。
- 提供完整的角色卡 CRUD 管理能力。
- 支持公开和私有权限。
- 提供移动端优先的单列多级页面体验。
- 抽出可复用资产管理组件，供后续预设、世界书等功能使用。
- 使用传统分页模型 `pageIndex` 和 `pageSize`，并调整共享分页类型。

## 非目标

- 不实现头像文件存储、上传或展示。
- 不导出未进入 Rolesta 领域模型的原始字段。
- 不做导入去重，同名、同作者、同版本角色卡允许共存。
- 不要求角色卡模块内部页面具备独立深链 URL。
- 不在本阶段完整复刻 SillyTavern 的所有编辑行为。

## 领域模型

后端以 `CharacterCard` 作为内部领域对象。字段命名使用 Rolesta 语义，SillyTavern 兼容字段只出现在 mapper 和 DTO 边界。

核心字段：

```ts
type CharacterVisibility = 'private' | 'public';

interface CharacterCard {
  id: string;
  ownerUserId: string;
  visibility: CharacterVisibility;

  name: string;
  nickname: string | null;
  comment: string;
  tags: string[];
  version: string;
  creator: string | null;

  description: string;
  personality: string;
  scenario: string;
  firstMessage: string;
  alternateGreetings: string[];
  groupOnlyGreetings: string[];
  messageExample: string;

  creatorNotes: string;
  creatorNotesMultilingual: Record<string, string>;
  systemPrompt: string;
  postHistoryInstructions: string;
  characterBook: unknown | null;
  assets: unknown[];
  source: string[];
  metadata: Record<string, unknown>;

  sourceFormat: 'sillytavern_v1' | 'sillytavern_v2' | 'sillytavern_v3';
  sourceSnapshot: unknown;

  createdAtMs: EpochMillis;
  updatedAtMs: EpochMillis;
  creationDateMs: EpochMillis | null;
  modificationDateMs: EpochMillis | null;
  lastUsedAtMs: EpochMillis | null;
  usageCount: number;
}
```

`EpochMillis` 在应用层使用安全整数范围内的 `number`：

```ts
type EpochMillis = number;
```

数据库使用整数语义保存时间：

- SQLite: `integer`
- PostgreSQL: `bigint`
- MySQL: `bigint`

DB adapter 层负责将 driver 返回值转换为 `EpochMillis`。写入前校验 `Number.isSafeInteger(value)`。

## SillyTavern 兼容映射

兼容转换集中在：

```txt
apps/api/src/characters/infrastructure/silly-tavern-character-card.mapper.ts
```

导入：

- JSON 导入支持 V1、V2、V3。
- PNG 导入读取 metadata 中的角色卡 JSON，忽略 PNG 图片内容。
- 导入成功始终创建新角色卡。
- 可选字段缺失时写入领域默认空值。
- 关键字段类型错误时导入失败。
- 导入时保存 `sourceSnapshot`，用于排查导入差异。

导出：

- 默认导出 V3 JSON。
- 支持通过参数导出 V2 或 V3。
- 只根据 Rolesta 领域模型生成兼容结构。
- 未建模的原始字段和未支持的 `extensions` 不导出。
- 本阶段不生成带嵌入 metadata 的 PNG 文件。

V3 支持字段包括：`assets`、`nickname`、`creator_notes_multilingual`、`source`、`group_only_greetings`、`creation_date`、`modification_date` 等。只保存和导出领域模型支持的部分。

## 数据库

新增 `characters` 表：

```txt
characters
  id varchar primary key
  owner_user_id varchar not null references users(id)
  visibility varchar not null

  name varchar not null
  nickname varchar null
  comment text not null
  tags_json text not null
  version varchar not null
  creator varchar null

  description text not null
  personality text not null
  scenario text not null
  first_message text not null
  alternate_greetings_json text not null
  group_only_greetings_json text not null
  message_example text not null

  creator_notes text not null
  creator_notes_multilingual_json text not null
  system_prompt text not null
  post_history_instructions text not null
  character_book_json text null
  assets_json text not null
  source_json text not null
  metadata_json text not null

  source_format varchar not null
  source_snapshot_json text not null

  created_at_ms integer not null
  updated_at_ms integer not null
  creation_date_ms integer null
  modification_date_ms integer null
  last_used_at_ms integer null
  usage_count integer not null
```

索引：

- `(owner_user_id, created_at_ms)`
- `(visibility, created_at_ms)`
- `(updated_at_ms)`
- `(name)`
- `(last_used_at_ms)`
- `(usage_count)`

## 权限

权限字段：

```ts
visibility: 'private' | 'public'
```

规则：

- 新增角色卡默认 `private`。
- 私有角色卡只有拥有者可读、可编辑、可删除、可导出。
- 公开角色卡所有登录用户可读、可导出。
- 公开角色卡只有拥有者可编辑、可删除、修改权限。
- 列表默认 scope 为 `all`，展示“我的全部角色卡 + 他人的公开角色卡”。
- 我的公开角色卡在 `all` 中只出现一次。

权限需要在 use case 层判断，store 查询也需要带上 `ownerUserId` 和 `visibility` 条件。

## 分页

调整共享分页模型：

```ts
export interface PageRequest {
  pageIndex: number;
  pageSize: number;
}

export interface PageResponse<TItem> {
  items: TItem[];
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

约定：

- `pageIndex` 从 0 开始。
- `pageSize` 由前端下拉框选择。
- 后端排序使用请求排序字段 + `id` 作为第二排序键，保证稳定顺序。

## API

接口：

```txt
GET    /characters
GET    /characters/:id
POST   /characters
PATCH  /characters/:id
DELETE /characters/:id

POST   /characters/import
GET    /characters/:id/export/sillytavern
```

列表参数：

```ts
interface ListCharactersQuery {
  scope?: 'all' | 'mine' | 'public';
  sort?: 'createdAt' | 'updatedAt' | 'name' | 'lastUsedAt' | 'usageCount';
  direction?: 'asc' | 'desc';
  pageIndex?: number;
  pageSize?: number;
  q?: string;
}
```

导入接口：

- 使用 `multipart/form-data` 上传 `.json` 或 `.png`。
- 返回导入后的角色卡摘要。
- 解析失败时返回明确错误码和用户可理解的错误信息。

导出接口：

```txt
GET /characters/:id/export/sillytavern?version=v3
GET /characters/:id/export/sillytavern?version=v2
```

默认导出 V3。

## 后端结构

```txt
apps/api/src/characters/
  domain/
    character-card.ts
    character-visibility.ts
  application/
    list-characters.use-case.ts
    get-character.use-case.ts
    create-character.use-case.ts
    update-character.use-case.ts
    delete-character.use-case.ts
    import-character-card.use-case.ts
    export-character-card.use-case.ts
    character-card-store.ts
  infrastructure/
    kysely-character-card-store.ts
    silly-tavern-character-card.mapper.ts
    silly-tavern-png-metadata.reader.ts
  http/
    characters.controller.ts
    character-requests.dto.ts
    character-responses.dto.ts
```

## 前端组件设计

角色卡管理以可嵌套组件为核心：

```tsx
<CharacterCardManager onBack={handleBack} />
```

组件本身不依赖 URL 路由信息。独立调试路由只负责渲染这个组件，后续 WorkspaceShell 也渲染同一个组件。

内部页面栈：

```ts
type CharacterCardPanel =
  | { name: 'list' }
  | { name: 'create' }
  | { name: 'edit'; characterId: string }
  | { name: 'advanced'; characterId: string }
  | { name: 'greetings'; characterId: string }
  | { name: 'import' };
```

返回逻辑：

- `MobileTopBar` sticky 置顶。
- 页面内返回弹出内部页面栈。
- 当前页面是 `list` 时调用外部传入的 `onBack`。
- 列表页保持挂载，通过切换可见页面保留筛选、排序、分页、pageSize、搜索词和滚动位置。

独立调试入口：

```txt
/app/characters
```

该路由只用于开发、调试和验收。

## 前端页面

列表页：

- 顶栏：返回、标题、导入、新增。
- 搜索：名称、注释、标签。
- 范围筛选：全部、我的、公开。默认全部。
- 排序：创建时间、更新时间、A-Z、最近使用、最常使用。
- 分页区放在筛选和排序下方。
- 分页区支持 pageSize 下拉、第一页、上一页、下一页、最后一页。
- 分页按钮使用符号：`«`、`‹`、`›`、`»`。
- 列表条目显示头像占位、名称、权限、tags、版本号、注释一行。

基础编辑页：

- 名称
- 注释
- 标签
- 版本号
- 公开/私有
- 角色描述
- 第一条消息
- 其他开场入口
- 高级定义入口

高级定义页：

- 提示词覆盖折叠组：`systemPrompt`、`postHistoryInstructions`
- 元数据折叠组：`creator`、`nickname`、`source`、`assets`、`creatorNotesMultilingual`
- 角色设定摘要
- 情景
- 角色备注
- 对话示例
- 角色书字段预留

导入页：

- 文件选择或拖放。
- 支持 `.json` 和 `.png`。
- 展示解析预览：名称、版本、tags、检测到的 ST 版本、开场数量。
- 确认导入后创建新角色卡。
- PNG 不展示头像预览。

## 复用组件

通用资产组件：

```txt
apps/web/src/features/assets/components/
  mobile-top-bar.tsx
  asset-list-item.tsx
  asset-tag-list.tsx
  asset-scope-tabs.tsx
  asset-sort-menu.tsx
  page-controls.tsx
  mobile-form-section.tsx
  collapsible-field-group.tsx
```

角色卡组件：

```txt
apps/web/src/features/characters/components/
  character-card-manager.tsx
  character-card-form.tsx
  character-greetings-editor.tsx
  character-import-panel.tsx
  character-advanced-form.tsx
```

## 视觉规则

- 以移动端为基础设计，宽屏仍保持单列。
- 宽屏可以限制内容最大宽度并居中。
- 顶栏 sticky。
- 强调色克制使用，只用于保存、确认导入、新增提交等主要动作。
- 返回、筛选、排序、分页、高级入口等使用中性色。
- 角色条目内的权限、版本、tags 不使用大面积强调色。
- 不使用嵌套卡片。

## 测试

后端单元测试：

- V1/V2/V3 JSON 导入映射。
- PNG metadata 读取并导入，忽略头像数据。
- 导出 V2/V3 只包含领域模型支持字段。
- 私有角色只允许拥有者读取、编辑、删除、导出。
- 公开角色允许所有登录用户读取、导出。
- 非拥有者不能编辑、删除公开角色。
- 列表 `all`、`mine`、`public` 范围过滤正确。
- 排序字段 `createdAt`、`updatedAt`、`name`、`lastUsedAt`、`usageCount` 正确。
- 传统分页 `pageIndex`、`pageSize`、`totalItems`、`totalPages` 正确。
- Epoch millis 写入前校验安全整数。

前端测试：

- `CharacterCardManager` 独立渲染列表页。
- 筛选、排序、分页、pageSize 变更会刷新查询。
- 进入编辑页再返回，列表状态和滚动位置保留。
- 顶栏 sticky。
- 保存按钮使用强调色，次要按钮保持中性。
- 导入页能展示解析预览并提交导入。
- 基础编辑页和高级定义页使用内部页面栈返回。

端到端验收：

- 用户可以导入 ST JSON 角色卡。
- 用户可以导入 ST PNG metadata 角色卡。
- 用户可以新增、编辑、删除角色卡。
- 用户可以切换公开和私有权限。
- 默认列表展示 `all`。
- 用户可以分页浏览角色卡。
- 用户可以按创建时间、更新时间、A-Z、最近使用、最常使用排序。
- 用户可以导出 ST 兼容 JSON。
- 角色卡管理组件可嵌入外部容器运行。

## 样例素材

后续实现阶段可以使用 `tmp` 目录中的角色卡样例进行导入调试。`tmp/**` 已被 `.gitignore` 忽略，样例素材不进入提交。

## 参考

- SillyTavern Character Card V2: https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md
- Character Card V3: https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md
