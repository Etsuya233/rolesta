import { useCallback, useEffect, useMemo, useState } from "react";
import {
  hasWorkspacePanel,
  workspacePanelByKey,
  workspacePanelDefinitions,
  type OpenWorkspacePanelOptions,
  type WorkspaceActivePanels,
  type WorkspaceArea,
  type WorkspaceOpenedPanels,
  type WorkspacePanelKey,
} from "./workspace-panels";
import {
  readWorkspaceLayout,
  workspaceAreaKeys,
  writeWorkspaceLayout,
} from "./workspace-layout-storage";

const emptyOpenedPanels: WorkspaceOpenedPanels = {
  left: [],
  center: [],
  right: [],
  bottom: [],
};

const emptyActivePanels: WorkspaceActivePanels = {
  left: null,
  center: null,
  right: null,
  bottom: null,
};

export interface WorkspaceLayoutState {
  openedByArea: WorkspaceOpenedPanels;
  activeByArea: WorkspaceActivePanels;
  leftVisible: boolean;
  rightVisible: boolean;
  mobileArea: WorkspaceArea | null;
  openPanel: (
    panelKey: WorkspacePanelKey,
    options?: OpenWorkspacePanelOptions,
  ) => void;
  closeArea: (area: WorkspaceArea) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  closeMobileArea: () => void;
}

export function useWorkspaceLayout(): WorkspaceLayoutState {
  const initialLayout = useMemo(() => initialWorkspaceLayout(), []);
  const [openedByArea, setOpenedByArea] = useState(initialLayout.openedByArea);
  const [activeByArea, setActiveByArea] = useState(initialLayout.activeByArea);
  const [leftVisible, setLeftVisible] = useState(initialLayout.leftVisible);
  const [rightVisible, setRightVisible] = useState(initialLayout.rightVisible);
  const [mobileArea, setMobileArea] = useState<WorkspaceArea | null>(null);

  const openPanel = useCallback(
    (panelKey: WorkspacePanelKey, options: OpenWorkspacePanelOptions = {}) => {
      const panel = workspacePanelByKey(panelKey);

      if (!panel) {
        return;
      }

      const targetArea = options.area ?? panel.defaultArea;

      setOpenedByArea((current) => ({
        ...current,
        [targetArea]: current[targetArea].includes(panelKey)
          ? current[targetArea]
          : [...current[targetArea], panelKey],
      }));
      setActiveByArea((current) => ({
        ...current,
        [targetArea]: panelKey,
      }));

      if (targetArea === "left") {
        setLeftVisible(true);
      }

      if (targetArea === "right") {
        setRightVisible(true);
      }

      if (options.activateMobileArea === false) {
        return;
      }

      if (targetArea === "left" || targetArea === "right" || targetArea === "bottom") {
        setMobileArea(targetArea);
      }
    },
    [],
  );

  const closeArea = useCallback((area: WorkspaceArea) => {
    setMobileArea((current) => (current === area ? null : current));

    if (area === "left") {
      setLeftVisible(false);
      return;
    }

    if (area === "right") {
      setRightVisible(false);
      return;
    }

    setActiveByArea((current) => ({
      ...current,
      [area]: null,
    }));
  }, []);

  const toggleLeft = useCallback(() => {
    setLeftVisible((value) => !value);
    setMobileArea((current) => (current === "left" ? null : "left"));
  }, []);

  const toggleRight = useCallback(() => {
    setRightVisible((value) => !value);
    setMobileArea((current) => (current === "right" ? null : "right"));
  }, []);

  const closeMobileArea = useCallback(() => {
    setMobileArea(null);
  }, []);

  useEffect(() => {
    writeWorkspaceLayout({
      activeByArea,
      leftVisible,
      rightVisible,
    });
  }, [activeByArea, leftVisible, rightVisible]);

  return {
    openedByArea,
    activeByArea,
    leftVisible,
    rightVisible,
    mobileArea,
    openPanel,
    closeArea,
    toggleLeft,
    toggleRight,
    closeMobileArea,
  };
}

function initialWorkspaceLayout() {
  const persistedLayout = readWorkspaceLayout();
  const activeByArea = restoreActivePanels(persistedLayout?.activeByArea);
  const openedByArea = restoreOpenedPanels(activeByArea);

  return {
    openedByArea,
    activeByArea,
    leftVisible: persistedLayout?.leftVisible ?? true,
    rightVisible: persistedLayout?.rightVisible ?? true,
  };
}

function restoreActivePanels(
  persistedActivePanels: WorkspaceActivePanels | undefined,
): WorkspaceActivePanels {
  const activeByArea = { ...emptyActivePanels };

  for (const area of workspaceAreaKeys()) {
    const panelKey = persistedActivePanels?.[area];

    if (panelKey && hasWorkspacePanel(panelKey)) {
      activeByArea[area] = panelKey;
    }
  }

  for (const panel of workspacePanelDefinitions) {
    if (panel.defaultOpen && !activeByArea[panel.defaultArea]) {
      activeByArea[panel.defaultArea] = panel.key;
    }
  }

  return activeByArea;
}

function restoreOpenedPanels(activeByArea: WorkspaceActivePanels): WorkspaceOpenedPanels {
  const openedByArea = cloneOpenedPanels(emptyOpenedPanels);

  for (const panel of workspacePanelDefinitions) {
    if (panel.defaultOpen) {
      openedByArea[panel.defaultArea].push(panel.key);
    }
  }

  for (const area of workspaceAreaKeys()) {
    const panelKey = activeByArea[area];

    if (panelKey && !openedByArea[area].includes(panelKey)) {
      openedByArea[area].push(panelKey);
    }
  }

  return openedByArea;
}

function cloneOpenedPanels(openedPanels: WorkspaceOpenedPanels): WorkspaceOpenedPanels {
  return {
    left: [...openedPanels.left],
    center: [...openedPanels.center],
    right: [...openedPanels.right],
    bottom: [...openedPanels.bottom],
  };
}
