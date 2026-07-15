# Character Keep-Alive Stack Handoff

## 背景

角色卡编辑功能目前在移动端体验上需要接近原生手机应用的页面栈：进入新页面时，新页面覆盖在旧页面上；返回时弹出上层页面，下面的页面保持原本的视图状态。

当前已经做过一轮保活优化，但实现仍有职责混杂问题：

- `CharacterCardManager` 管外层 panel stack。
- `CharacterCardForm` 同时承担表单、编辑会话、screen 分发、部分视图保活职责。
- `CharacterGreetingsEditor` 已经改成编辑同一份表单草稿，但页面分发仍藏在 `CharacterCardForm` 里。

用户希望进一步把 Character 功能整理成一个统一的页面栈模型，并抽出可复用能力，后续可以给预设、世界书等功能复用。

## 需求

### 功能需求

- Character 根组件使用一个统一 Stack 管理全部页面。
- 列表页、创建页、导入页、编辑主页面、其他开场页面、未来三级/四级编辑页都作为同一种 stack page。
- 进入新页面时执行 `pushPage()`，新页面覆盖在当前页面之上。
- 返回时执行 `popPage()`，下层页面不重新挂载。
- 下层页面需要保留：
  - 滚动位置
  - Accordion 展开/折叠状态
  - 搜索、分页、排序状态
  - 输入框和未保存草稿
- “其他开场”不单独保存，编辑同一份角色卡草稿，由编辑主页面的保存流程统一提交。
- `MobileTopBar` 应属于每个页面自身，而不是 Character 根组件统一渲染的公共栏。
- 后续三级/四级页面应自然支持，例如：
  - `alternateGreetings`
  - `alternateGreetingDetail`
  - `characterBook`
  - `characterBookEntryDetail`

### 架构需求

- 不为了快速实现功能而降低代码质量。
- 保持代码可读、可维护，避免把导航逻辑、表单逻辑、页面 UI 塞进同一个大组件。
- 页面栈实现应有复用价值，优先作为通用组件或 hook 抽到共享位置。
- Character 的业务草稿状态要和页面视图状态分开。
- 页面分发逻辑应集中在 `CharacterPageRenderer`，不要散落在表单组件内部。

## 推荐模型

### 页面栈

Character 根组件维护一个页面栈：

```ts
type CharacterPage =
  | { name: 'list'; key: 'list' }
  | { name: 'create'; key: 'create'; sessionKey: string }
  | {
      name: 'editMain';
      key: string;
      characterId: string;
      sessionKey: string;
    }
  | {
      name: 'alternateGreetings';
      key: string;
      characterId: string;
      sessionKey: string;
    }
  | { name: 'import'; key: 'import' };
```

示例：

```ts
pushPage({
  name: 'editMain',
  key: `character:${characterId}:edit`,
  characterId,
  sessionKey: `character:${characterId}`,
});

pushPage({
  name: 'alternateGreetings',
  key: `character:${characterId}:alternateGreetings`,
  characterId,
  sessionKey: `character:${characterId}`,
});
```

### 草稿会话

单一 Stack 负责视图保活，但跨页面共享的业务草稿应由 draft session 管理。

建议在 Character 根组件或专用 provider 中维护：

```ts
type CharacterDraftSessions = Record<string, CharacterEditorDraftSession>;

interface CharacterEditorDraftSession {
  form: CharacterEditorFormState;
  setForm: React.Dispatch<React.SetStateAction<CharacterEditorFormState>>;
  characterId?: string;
  loadedCharacterId: string | null;
  isPending: boolean;
  visibleError: string | null;
  submit: () => void;
}
```

同一个 `sessionKey` 下的页面共享同一份草稿：

```txt
editMain(sessionKey: character:abc)
alternateGreetings(sessionKey: character:abc)
alternateGreetingDetail(sessionKey: character:abc)
```

## 可复用 Stack 抽象

建议新增通用目录：

```txt
apps/web/src/components/keep-alive-stack/
  keep-alive-stack-viewport.tsx
  use-keep-alive-stack.ts
```

或按项目习惯放入：

```txt
apps/web/src/features/assets/components/
```

如果预设、世界书、角色卡都要用，优先放到 `components/keep-alive-stack`。

### Hook

```ts
export interface KeepAliveStackPage {
  key: string;
}

export function useKeepAliveStack<TPage extends KeepAliveStackPage>(rootPage: TPage) {
  const [pages, setPages] = useState<TPage[]>([rootPage]);
  const activePage = pages[pages.length - 1]!;

  const pushPage = useCallback((page: TPage) => {
    setPages((items) => [...items, page]);
  }, []);

  const popPage = useCallback(() => {
    setPages((items) => (items.length > 1 ? items.slice(0, -1) : items));
  }, []);

  const replacePage = useCallback((page: TPage) => {
    setPages((items) => [...items.slice(0, -1), page]);
  }, []);

  const resetToRoot = useCallback(() => {
    setPages([rootPage]);
  }, [rootPage]);

  return { pages, activePage, pushPage, popPage, replacePage, resetToRoot };
}
```

### Viewport

页面应使用 z-index 表达 stack 层级，而不是只用 `hidden` 或 `invisible`。

```tsx
export function KeepAliveStackViewport<TPage extends KeepAliveStackPage>({
  pages,
  activeKey,
  renderPage,
}: {
  pages: TPage[];
  activeKey: string;
  renderPage: (page: TPage) => React.ReactNode;
}) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      {pages.map((page, index) => {
        const active = page.key === activeKey;

        return (
          <section
            key={page.key}
            aria-hidden={!active}
            className={cn(
              'absolute inset-0 min-h-0 overflow-y-auto bg-background',
              active ? 'pointer-events-auto' : 'pointer-events-none',
            )}
            style={{ zIndex: index }}
          >
            {renderPage(page)}
          </section>
        );
      })}
    </div>
  );
}
```

说明：

- `zIndex: index` 表达页面栈层级。
- 上层页面完整覆盖下层页面。
- 非 active 页面保留 mounted，禁止 pointer events。
- 非 active 页面设置 `aria-hidden`，避免辅助技术读到下层页面。
- 每个页面必须有 `bg-background`，避免透出下层页面。
- 不使用 `display:none`，避免恢复布局时触发滚动和 Accordion 高度重算问题。

## Character 目标结构

建议拆成：

```txt
apps/web/src/features/characters/components/
  character-card-manager.tsx
  character-page-renderer.tsx
  character-list-page.tsx
  character-edit-page.tsx
  character-create-page.tsx
  character-import-page.tsx
  character-greetings-page.tsx
  character-card-main-editor.tsx
  character-greetings-editor.tsx
  character-form-fields.tsx

apps/web/src/features/characters/hooks/
  use-character-draft-sessions.ts
```

如果 `CharacterEditorFormState` 和转换逻辑继续增长，建议拆到：

```txt
apps/web/src/features/characters/components/character-editor-form.ts
```

或：

```txt
apps/web/src/features/characters/model/character-editor-form.ts
```

内容包括：

- `CharacterEditorFormState`
- `emptyCharacterEditorForm`
- `editorFormFromCharacter`
- `editorValuesFromForm`
- `tagsFromText`

## 页面组件职责

### `CharacterCardManager`

职责：

- 初始化 Character 页面栈，root page 是 `list`。
- 提供 `pushPage`、`popPage`、`replacePage` 给页面使用。
- 持有或挂载 draft session provider。
- 渲染 `KeepAliveStackViewport`。

不负责：

- 不根据当前页面统一拼标题。
- 不统一渲染 `MobileTopBar`。
- 不包含具体表单字段。

### `CharacterPageRenderer`

职责：

- 根据 `page.name` 分发页面。

示例：

```tsx
function CharacterPageRenderer({ page }: { page: CharacterPage }) {
  if (page.name === 'list') {
    return <CharacterListPage />;
  }

  if (page.name === 'editMain') {
    return <CharacterEditPage page={page} />;
  }

  if (page.name === 'alternateGreetings') {
    return <CharacterGreetingsPage page={page} />;
  }

  if (page.name === 'create') {
    return <CharacterCreatePage page={page} />;
  }

  return <CharacterImportPage />;
}
```

### 页面组件

每个页面自己包含 `MobileTopBar`：

```tsx
function CharacterEditPage({ page }: { page: EditMainPage }) {
  return (
    <CharacterStackPage>
      <MobileTopBar title="编辑角色卡" onBack={popPage} />
      <CharacterCardMainEditor sessionKey={page.sessionKey} />
    </CharacterStackPage>
  );
}
```

通用页面壳：

```tsx
function CharacterStackPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">{children}</div>
  );
}
```

### `CharacterCardMainEditor`

职责：

- 渲染基础信息、角色内容、提示词覆盖、元数据等 Accordion。
- 持有主编辑页自己的视图状态，例如 `openSections`。
- 使用 `sessionKey` 读写角色卡草稿。
- 点击“其他开场”时 push 新页面：

```ts
pushPage({
  name: 'alternateGreetings',
  key: `${sessionKey}:alternateGreetings`,
  characterId,
  sessionKey,
});
```

### `CharacterGreetingsPage`

职责：

- 自己渲染 `MobileTopBar title="开场消息"`。
- 使用 `sessionKey` 读写同一份 `form.alternateGreetings`。
- 不发起独立 `getCharacter`。
- 不发起独立 `updateCharacter`。
- 不显示独立保存按钮。

### `CharacterGreetingsEditor`

职责：

- 只做受控编辑器。
- 接收 `greetings`、`disabled`、`onChange`。
- 不知道页面栈。
- 不知道 API。

## 当前相关文件

当前已经触碰过的文件包括：

```txt
apps/web/src/features/characters/components/character-card-manager.tsx
apps/web/src/features/characters/components/character-card-form.tsx
apps/web/src/features/characters/components/character-greetings-editor.tsx
apps/web/src/features/characters/components/character-import-panel.tsx
apps/web/src/features/characters/hooks/use-character-card-manager.ts
apps/web/tests/api-mocks.ts
apps/web/tests/characters.spec.ts
```

当前测试里已经有一条关键回归：

```txt
keeps character views alive while editing alternate greetings
```

它覆盖：

- 列表搜索状态保留。
- 编辑主页面滚动位置保留。
- `角色内容` Accordion 展开状态保留。
- “其他开场”编辑同一份草稿。
- 主保存时提交 `alternateGreetings`。

## 推荐改造步骤

### Step 1: 抽通用 Stack

新增：

```txt
apps/web/src/components/keep-alive-stack/use-keep-alive-stack.ts
apps/web/src/components/keep-alive-stack/keep-alive-stack-viewport.tsx
```

先只抽当前 Character 需要的能力：

- `pages`
- `activePage`
- `pushPage`
- `popPage`
- `replacePage`
- `resetToRoot`

不要提前加入动画、手势、缓存上限、路由同步等功能。

### Step 2: 定义 `CharacterPage`

在 Character feature 内新增页面类型。

建议文件：

```txt
apps/web/src/features/characters/components/character-pages.ts
```

或放在 `character-card-manager.tsx` 附近。

### Step 3: 建立 `CharacterPageRenderer`

把所有 `page.name` 分发集中到一个组件。

不要让 `CharacterCardMainEditor` 或 `CharacterGreetingsEditor` 知道其它页面类型。

### Step 4: 拆页面组件

从当前组件中拆出：

- `CharacterListPage`
- `CharacterEditPage`
- `CharacterCreatePage`
- `CharacterImportPage`
- `CharacterGreetingsPage`

每个页面包含自己的 `MobileTopBar`。

### Step 5: 拆主编辑页

把当前 `CharacterCardForm` 中的主编辑 Accordion JSX 提取为：

```txt
character-card-main-editor.tsx
```

让 `openSections` 留在 `CharacterCardMainEditor` 内。

### Step 6: 建立 draft session

把当前 `CharacterCardForm` 里持有的草稿、初始化、保存逻辑移动到 draft session。

要求：

- `editMain` 和 `alternateGreetings` 使用同一个 `sessionKey`。
- 查询数据只在进入某个角色编辑会话时初始化一次。
- 保存成功后更新 query cache。
- 创建成功后 replace 当前 create page 为 edit page，并复用或迁移 session。

### Step 7: 删除旧的内外两套 stack

收敛掉：

- `CharacterCardPanel` 外层 panel stack。
- `CharacterEditorScreen` 内层 screen stack。

替换为单一 `CharacterPage` stack。

## 测试要求

保留并扩展现有 e2e：

```powershell
corepack pnpm --filter @rolesta/web exec playwright test tests/characters.spec.ts
```

至少覆盖：

- 列表页搜索后进入编辑页，再返回，搜索词仍在。
- 编辑主页面滚动到下方，进入其他开场，再返回，滚动位置不变。
- 折叠/展开 `角色内容` 后进入其他开场，再返回，Accordion 状态不变。
- 其他开场编辑后返回主页面，点击主保存，PATCH 请求包含 `alternateGreetings`。
- 进入导入页再返回，列表状态保留。

静态验证：

```powershell
corepack pnpm --filter @rolesta/web typecheck
corepack pnpm --filter @rolesta/web lint
corepack pnpm --filter @rolesta/web build
```

## 质量约束

- 不写防御性代码。
- 不写无意义兜底。
- 不为了少拆文件而把导航、表单、页面 UI 混在一个组件里。
- `page.key` 必须稳定，不能每次 render 生成随机 key。
- 页面隐藏不能使用 `display:none` 作为保活隐藏策略。
- 非 active 页面必须禁止 pointer events。
- 非 active 页面必须 `aria-hidden`。
- 跨页面共享的业务草稿必须在 session 层，不能散落到页面局部 state。
- 页面自己的 UI 状态留在页面内部，因为页面被保活后自然保留。

## 风险点

- 如果每个页面都带 `MobileTopBar`，必须确保页面 section 是完整高度，否则 top bar 和内容滚动可能互相影响。
- `KeepAliveStackViewport` 的每个 page section 应是 `absolute inset-0`，页面内部再 `flex h-full min-h-0 flex-col`。
- 如果上层页面没有 `bg-background`，会透出下层页面。
- 如果 `CharacterCardMainEditor` 的滚动容器和页面容器职责不清，仍可能出现滚动位置错位。
- 如果创建角色后 sessionKey 变化处理不好，可能丢失新建草稿或保存状态。

## 最终目标

改造完成后，Character 功能应呈现为：

```txt
CharacterCardManager
  useKeepAliveStack<CharacterPage>
  CharacterDraftSessionsProvider
  KeepAliveStackViewport
    CharacterPageRenderer
      CharacterListPage
      CharacterEditPage
        CharacterCardMainEditor
      CharacterGreetingsPage
        CharacterGreetingsEditor
      CharacterImportPage
      CharacterCreatePage
```

这个结构可以作为后续预设、世界书等资产模块的参考实现。
