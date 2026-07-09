# Workspace Design

Date: 2026-07-09

## Goal

Build a VSCode-like Workspace for Rolesta's model console. The Workspace is usable before a chat is selected. It gives users a stable place to inspect recent work, choose chats, view the current chat context, and open asset or model panels without leaving the console.

The first version focuses on a fixed shell, panel switching, panel keep-alive behavior, and basic layout persistence. It does not include freeform drag-and-drop, user-defined layout mapping, bottom-panel runtime data, or a public plugin API.

## Existing Context

The `/app` route already renders `WorkbenchPage`, which is currently a placeholder. Asset features such as worldbooks, characters, presets, and model providers already have manager components with their own internal navigation stacks. Workspace should reuse those managers instead of reimplementing their list and editor flows.

The existing frontend uses React, Vite, Tailwind v4, shadcn/ui-style components, and route-level feature modules under `apps/web/src/features`.

## Layout

Workspace has five stable areas:

- Top toolbar
- Left
- Center
- Right
- Bottom

Desktop layout:

```text
┌──────┬────────────────────────┬──────┐
│      │ Top toolbar            │      │
│ Left ├────────────────────────┤ Right│
│      │ Center                 │      │
│      ├────────────────────────┤      │
│      │ Bottom                 │      │
└──────┴────────────────────────┴──────┘
```

Mobile layout keeps the top toolbar visible at all times. Center is the main body. Left and Right open as side sheets. Bottom opens as a bottom drawer when it gains real content in a later iteration.

## Area Responsibilities

Top toolbar is the global control strip. It has a left sidebar toggle on the left, all panel buttons in the middle, and a right sidebar toggle on the right. Panel buttons are generated from the Workspace panel registry and ordered by `toolbarOrder`. The toolbar does not group buttons in the first version.

Left is the workspace context bar. It shows the chat list and the current chat's key context, such as character, user persona, preset, model profile, and bound worldbooks. When no chat is selected, it still shows the chat list and entry points for selecting or creating a chat.

Center is the main work surface. When no chat is selected, it shows recent workspace activity: recent chats, recently edited assets, and recent debug records. Later, selected chats can use Center for the conversation, prompt previews, or other primary views.

Right hosts full asset and model panels. Worldbooks, characters, presets, and model providers open here by default. The panels should embed existing manager components and preserve their internal list, editor, import, and stack flows.

Bottom is reserved in the first version. It keeps its layout slot but does not connect to generation logs, context debug data, or request previews yet.

## Panel Registry

Workspace panels are declared through a frontend-local registry. This registry is an internal extension point for Rolesta panels. It is not a plugin contract.

```ts
export type WorkspaceArea = "left" | "center" | "right" | "bottom";

export type WorkspacePanelKey =
  | "chatContext"
  | "recentWorkspace"
  | "worldbooks"
  | "characters"
  | "presets"
  | "modelProviders";

export interface OpenWorkspacePanelOptions {
  area?: WorkspaceArea;
  activateMobileArea?: boolean;
}

export interface WorkspacePanelRuntime {
  activeChatId?: string;
  openPanel: (
    panelKey: WorkspacePanelKey,
    options?: OpenWorkspacePanelOptions,
  ) => void;
  closeArea: (area: WorkspaceArea) => void;
}

export interface WorkspacePanelDefinition {
  key: WorkspacePanelKey;
  defaultArea: WorkspaceArea;
  labelKey: string;
  icon: React.ComponentType;
  toolbarOrder: number;
  defaultOpen?: boolean;
  allowClose?: boolean;
  Component: React.ComponentType<WorkspacePanelRuntime>;
}
```

`defaultArea` is the normal placement for a panel. `openPanel(panelKey)` uses that default. Callers can override the target area:

```ts
openPanel("worldbooks");
openPanel("worldbooks", { area: "center" });
```

The same panel key may be open in multiple areas at the same time. Each area owns its own instance, so state is independent across areas. Within a single area, the same panel key appears only once.

## State Model

Workspace stores active and opened panels by area:

```ts
type WorkspaceOpenedPanels = Record<WorkspaceArea, WorkspacePanelKey[]>;
type WorkspaceActivePanels = Record<WorkspaceArea, WorkspacePanelKey | null>;
```

`openPanel` finds the panel definition, chooses `options.area ?? panel.defaultArea`, adds the panel key to that area's opened list, then marks it active for that area. On mobile, opening a panel in Left, Right, or Bottom also expands that area unless `activateMobileArea` is `false`.

Basic layout state is persisted locally:

```ts
interface PersistedWorkspaceLayout {
  activeByArea: WorkspaceActivePanels;
  leftVisible: boolean;
  rightVisible: boolean;
}
```

Persistence restores which panel is active in each area and whether Left or Right is visible on desktop. It does not restore internal manager stacks across refreshes. After refresh, each active panel is mounted as the opened panel for its area, and `defaultOpen` panels are added where needed.

When persisted panel keys no longer exist in the registry, Workspace ignores those keys and uses the area defaults.

## Keep-Alive Behavior

Panels remain mounted after first open. Switching within an area hides the previous panel and shows the active one. This preserves manager state during the page lifetime, including internal stacks, unsaved form drafts, query cache usage, and scroll state when the underlying component supports it.

`WorkspacePanelHost` renders each opened panel for one area:

```tsx
<WorkspacePanelHost
  area="right"
  openedKeys={openedByArea.right}
  activeKey={activeByArea.right}
  runtime={runtime}
/>
```

React keys include both area and panel key:

```tsx
const instanceKey = `${area}:${panel.key}`;
```

This keeps cross-area instances separate.

Hidden panels should stay mounted. The host can use `aria-hidden` and `inert` for inactive panels. If a manager needs stable measurements while hidden, the host should prefer visibility and pointer-event classes over unmounting.

## Top Toolbar

The toolbar is intentionally simple:

- Left side: `PanelLeftIcon` button toggles Left.
- Middle: all registry panels as buttons, ordered by `toolbarOrder`.
- Right side: `PanelRightIcon` button toggles Right.

Panel buttons call `openPanel(panel.key)`. A panel button is active when that panel is active in any area. If the same panel is active in multiple areas, the toolbar still shows one active button.

Desktop behavior:

- Left toggle collapses or expands the left column.
- Right toggle collapses or expands the right column.
- Panel buttons switch content in the panel's target area.

Mobile behavior:

- Left toggle opens or closes the Left sheet.
- Right toggle opens or closes the Right sheet.
- Panel buttons still call `openPanel`. If the target area is a sheet area, Workspace opens that sheet.

Bottom has no toolbar toggle in the first version.

## Visual Style

Workspace should use shadcn/ui components as the base composition layer. The target style is a calm shadcn v4 control-console surface with IDE-like density.

Use existing or shadcn-added components for common UI:

- `Button`, `ToggleGroup`, and `Tooltip` for toolbar controls
- `Sidebar` primitives for the Left context bar
- `Sheet` for mobile Left and Right
- `Drawer` for future mobile Bottom
- `ScrollArea` for scrollable panel bodies
- `Separator` for structural dividers
- `Badge` for compact model, preset, and status labels
- `Empty` for empty states
- `Skeleton` for loading states

The visual language should use semantic tokens such as `bg-background`, `bg-muted`, `border-border`, and `text-muted-foreground`. Avoid custom color systems for Workspace. Use thin borders, stable spacing, and low-contrast surfaces. Cards are appropriate for recent workspace items and asset summaries, but page sections should not become nested cards.

The design can reference the shadcn v4 homepage card examples for component composition and spacing discipline, while keeping the Workspace closer to a workbench than a landing page.

Icon choice should follow the project's shadcn configuration. If the project uses lucide, Workspace uses lucide icons consistently.

## Component Structure

Recommended frontend modules:

- `features/chats/routes/workbench-page.tsx`
- `features/workspace/components/workspace-shell.tsx`
- `features/workspace/components/workspace-toolbar.tsx`
- `features/workspace/components/workspace-panel-host.tsx`
- `features/workspace/components/workspace-left-context-panel.tsx`
- `features/workspace/components/recent-workspace-panel.tsx`
- `features/workspace/model/workspace-panels.tsx`
- `features/workspace/model/use-workspace-layout.ts`
- `features/workspace/model/workspace-layout-storage.ts`

`WorkbenchPage` connects `/app` to Workspace. `WorkspaceShell` owns the area layout and responsive presentation. `workspace-panels.tsx` defines panel metadata and components. `useWorkspaceLayout` owns panel opening, active area state, visibility, mobile sheet state, and persistence coordination.

Asset panels reuse existing managers:

- `WorldbookManager`
- `CharacterCardManager`
- `PresetManager`
- `ModelProviderManager`

Workspace should not reach into those managers' internal page stacks.

## Initial Panel Set

Initial defaults:

```ts
[
  {
    key: "chatContext",
    defaultArea: "left",
    defaultOpen: true,
  },
  {
    key: "recentWorkspace",
    defaultArea: "center",
    defaultOpen: true,
  },
  {
    key: "worldbooks",
    defaultArea: "right",
  },
  {
    key: "characters",
    defaultArea: "right",
  },
  {
    key: "presets",
    defaultArea: "right",
  },
  {
    key: "modelProviders",
    defaultArea: "right",
  },
]
```

The actual registry also includes labels, icons, `toolbarOrder`, and component references.

## Empty And Loading States

Center shows recent workspace by default. If there are no recent items, it shows an empty state with actions to select or create a chat and open asset managers.

Left shows the chat list area. If no chats exist, it shows an empty state with a create action. Current chat metadata is hidden or replaced with an empty state until a chat is selected.

Right is empty until the user opens a panel. It can show a quiet placeholder prompting the user to pick a toolbar item.

Bottom remains blank in the first version.

## Testing

Add focused tests around Workspace behavior:

- `/app` renders the Workspace shell.
- Toolbar buttons are generated from the panel registry.
- Clicking Worldbooks activates the Right panel.
- Switching away from a Right panel and back keeps the panel mounted.
- Refresh restores active panels by area.
- Desktop Left and Right toggles collapse and expand their columns.
- Mobile Left and Right toggles open sheets.
- Mobile panel buttons open the target sheet when needed.

Existing manager behavior should stay covered by manager-level tests. Workspace tests should not duplicate worldbook, character, preset, or model-provider business flows.

## Out Of Scope

- Freeform drag-and-drop layout
- User-defined target areas
- Persisting manager internal stacks across refresh
- Bottom generation logs and context debug data
- Public plugin API
- Exact deep-link navigation into a manager's internal edit page
- Rewriting existing asset managers for Workspace
