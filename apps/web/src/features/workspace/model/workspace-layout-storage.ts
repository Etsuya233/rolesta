import type {
  WorkspaceActivePanels,
  WorkspaceArea,
} from "./workspace-panels";

export interface PersistedWorkspaceLayout {
  activeByArea: WorkspaceActivePanels;
  leftVisible: boolean;
  rightVisible: boolean;
  panelSizes?: WorkspacePanelSizes;
}

export interface WorkspacePanelSizes {
  leftWidth: number;
  rightWidth: number;
}

const STORAGE_KEY = "rolesta.workspace.layout.v1";

export function readWorkspaceLayout(): PersistedWorkspaceLayout | null {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const value = JSON.parse(rawValue) as PersistedWorkspaceLayout;

  return value;
}

export function writeWorkspaceLayout(layout: PersistedWorkspaceLayout) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function workspaceAreaKeys(): WorkspaceArea[] {
  return ["left", "center", "right", "bottom"];
}
