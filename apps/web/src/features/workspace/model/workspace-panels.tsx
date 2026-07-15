import type { ComponentType } from "react";
import {
  BotIcon,
  BoxesIcon,
  BrainCircuitIcon,
  Clock3Icon,
  FlaskConicalIcon,
  LibraryIcon,
  MessagesSquareIcon,
} from "lucide-react";
import { CharacterCardManager } from "../../characters/components/character-card-manager";
import { ModelProviderManager } from "../../model-providers/components/model-provider-manager";
import { PresetManager } from "../../presets/components/preset-manager";
import { FeatureTestPanel } from "../../testing/components/feature-test-panel";
import { WorldbookManager } from "../../worldbooks/components/worldbook-manager";
import { RecentWorkspacePanel } from "../components/recent-workspace-panel";
import { ChatSidebar } from "../../chats/components/chat-sidebar";

export type WorkspaceArea = "left" | "center" | "right" | "bottom";

export type WorkspacePanelKey =
  | "chatContext"
  | "recentWorkspace"
  | "worldbooks"
  | "characters"
  | "presets"
  | "modelProviders"
  | "testing";

export type WorkspaceOpenedPanels = Record<WorkspaceArea, WorkspacePanelKey[]>;
export type WorkspaceActivePanels = Record<WorkspaceArea, WorkspacePanelKey | null>;

export interface OpenWorkspacePanelOptions {
  area?: WorkspaceArea;
  activateMobileArea?: boolean;
}

export interface WorkspacePanelRuntime {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  openPanel: (
    panelKey: WorkspacePanelKey,
    options?: OpenWorkspacePanelOptions,
  ) => void;
  closeArea: (area: WorkspaceArea) => void;
  closeMobileArea: () => void;
}

export interface WorkspacePanelDefinition {
  key: WorkspacePanelKey;
  defaultArea: WorkspaceArea;
  labelKey: string;
  icon: ComponentType;
  toolbarOrder: number;
  defaultOpen?: boolean;
  allowClose?: boolean;
  Component: ComponentType<WorkspacePanelRuntime>;
}

function WorldbookWorkspacePanel(runtime: WorkspacePanelRuntime) {
  return <WorldbookManager onBack={() => runtime.closeArea("right")} />;
}

function CharacterWorkspacePanel(runtime: WorkspacePanelRuntime) {
  return <CharacterCardManager onBack={() => runtime.closeArea("right")} />;
}

function PresetWorkspacePanel(runtime: WorkspacePanelRuntime) {
  return <PresetManager onBack={() => runtime.closeArea("right")} />;
}

function ModelProviderWorkspacePanel(runtime: WorkspacePanelRuntime) {
  return <ModelProviderManager onBack={() => runtime.closeArea("right")} />;
}

export const workspacePanelDefinitions = [
  {
    key: "chatContext",
    defaultArea: "left",
    labelKey: "chats.workbench.panels.chatContext",
    icon: MessagesSquareIcon,
    toolbarOrder: 10,
    defaultOpen: true,
    Component: ChatSidebar,
  },
  {
    key: "recentWorkspace",
    defaultArea: "center",
    labelKey: "chats.workbench.panels.recentWorkspace",
    icon: Clock3Icon,
    toolbarOrder: 20,
    defaultOpen: true,
    Component: RecentWorkspacePanel,
  },
  {
    key: "worldbooks",
    defaultArea: "right",
    labelKey: "chats.workbench.panels.worldbooks",
    icon: LibraryIcon,
    toolbarOrder: 30,
    Component: WorldbookWorkspacePanel,
  },
  {
    key: "characters",
    defaultArea: "right",
    labelKey: "chats.workbench.panels.characters",
    icon: BotIcon,
    toolbarOrder: 40,
    Component: CharacterWorkspacePanel,
  },
  {
    key: "presets",
    defaultArea: "right",
    labelKey: "chats.workbench.panels.presets",
    icon: BoxesIcon,
    toolbarOrder: 50,
    Component: PresetWorkspacePanel,
  },
  {
    key: "modelProviders",
    defaultArea: "right",
    labelKey: "chats.workbench.panels.modelProviders",
    icon: BrainCircuitIcon,
    toolbarOrder: 60,
    Component: ModelProviderWorkspacePanel,
  },
  ...(
    import.meta.env.ENABLE_TEST_PANEL === "true" ||
    (import.meta.env.ENABLE_TEST_PANEL === undefined && import.meta.env.DEV)
      ? [
          {
            key: "testing" as const,
            defaultArea: "center" as const,
            labelKey: "chats.workbench.panels.testing",
            icon: FlaskConicalIcon,
            toolbarOrder: 70,
            Component: FeatureTestPanel,
          },
        ]
      : []
  ),
] satisfies WorkspacePanelDefinition[];

export function workspacePanelByKey(panelKey: WorkspacePanelKey) {
  return workspacePanelDefinitions.find((panel) => panel.key === panelKey) ?? null;
}

export function hasWorkspacePanel(panelKey: string): panelKey is WorkspacePanelKey {
  return workspacePanelDefinitions.some((panel) => panel.key === panelKey);
}
