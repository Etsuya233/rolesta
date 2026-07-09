import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "../../../components/ui/empty";
import { cn } from "../../../lib/utils";
import { useWorkspaceLayout } from "../model/use-workspace-layout";
import type {
  WorkspaceArea,
  WorkspacePanelKey,
  WorkspacePanelRuntime,
} from "../model/workspace-panels";
import { WorkspacePanelHost } from "./workspace-panel-host";
import { WorkspaceToolbar } from "./workspace-toolbar";

interface WorkspaceShellProps {
  activeChatId?: string | undefined;
}

const workspaceAreas: WorkspaceArea[] = ["left", "center", "right", "bottom"];

export function WorkspaceShell({ activeChatId }: WorkspaceShellProps) {
  const layout = useWorkspaceLayout();
  const desktopLayout = useDesktopWorkspaceLayout();
  const visibleByArea = useMemo<Record<WorkspaceArea, boolean>>(
    () => ({
      left: desktopLayout ? layout.leftVisible : layout.mobileArea === "left",
      center: true,
      right: desktopLayout ? layout.rightVisible : layout.mobileArea === "right",
      bottom: layout.mobileArea === "bottom",
    }),
    [desktopLayout, layout.leftVisible, layout.mobileArea, layout.rightVisible],
  );
  const activeToolbarPanelKeys = useMemo(() => {
    const panelKeys = new Set<WorkspacePanelKey>();

    for (const area of workspaceAreas) {
      const panelKey = layout.activeByArea[area];

      if (visibleByArea[area] && panelKey) {
        panelKeys.add(panelKey);
      }
    }

    return panelKeys;
  }, [layout.activeByArea, visibleByArea]);
  const runtime = useMemo<WorkspacePanelRuntime>(
    () => ({
      activeChatId,
      openPanel: layout.openPanel,
      closeArea: layout.closeArea,
    }),
    [activeChatId, layout.closeArea, layout.openPanel],
  );
  const toggleToolbarPanel = useCallback(
    (panelKey: WorkspacePanelKey) => {
      const activeArea = workspaceAreas.find(
        (area) => visibleByArea[area] && layout.activeByArea[area] === panelKey,
      );

      if (activeArea) {
        layout.closeArea(activeArea);
        return;
      }

      layout.openPanel(panelKey);
    },
    [layout.activeByArea, layout.closeArea, layout.openPanel, visibleByArea],
  );

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <WorkspaceToolbar
        activePanelKeys={activeToolbarPanelKeys}
        leftVisible={visibleByArea.left}
        rightVisible={visibleByArea.right}
        onToggleLeft={layout.toggleLeft}
        onToggleRight={layout.toggleRight}
        onOpenPanel={toggleToolbarPanel}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 bg-muted/30 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <WorkspaceSideArea
          area="left"
          visible={layout.leftVisible}
          mobileOpen={layout.mobileArea === "left"}
          desktopLayout={desktopLayout}
          side="left"
          className="border-r bg-sidebar lg:col-start-1 lg:w-72"
        >
          <WorkspacePanelHost
            area="left"
            openedKeys={layout.openedByArea.left}
            activeKey={layout.activeByArea.left}
            runtime={runtime}
          />
        </WorkspaceSideArea>

        <section
          data-testid="workspace-center-column"
          className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-background lg:col-start-2"
        >
          <WorkspacePanelHost
            area="center"
            openedKeys={layout.openedByArea.center}
            activeKey={layout.activeByArea.center}
            runtime={runtime}
          />
          <div
            data-testid="workspace-bottom-slot"
            className="hidden h-0 border-t bg-muted/30 lg:block"
          />
        </section>

        <WorkspaceSideArea
          area="right"
          visible={layout.rightVisible}
          mobileOpen={layout.mobileArea === "right"}
          desktopLayout={desktopLayout}
          side="right"
          className="border-l bg-background lg:col-start-3 lg:w-[28rem] xl:w-[32rem]"
        >
          <WorkspacePanelHost
            area="right"
            openedKeys={layout.openedByArea.right}
            activeKey={layout.activeByArea.right}
            runtime={runtime}
            emptyState={<RightPlaceholder />}
          />
        </WorkspaceSideArea>
      </div>
    </main>
  );
}

function WorkspaceSideArea({
  area,
  visible,
  mobileOpen,
  desktopLayout,
  side,
  className,
  children,
}: {
  area: WorkspaceArea;
  visible: boolean;
  mobileOpen: boolean;
  desktopLayout: boolean;
  side: "left" | "right";
  className?: string;
  children: ReactNode;
}) {
  return (
    <aside
      data-testid={`workspace-${area}-column`}
      data-visible={visible}
      data-mobile-open={mobileOpen}
      aria-hidden={desktopLayout ? !visible : !mobileOpen}
      inert={desktopLayout ? !visible : !mobileOpen}
      className={cn(
        "fixed bottom-0 top-12 z-40 flex w-screen min-h-0 flex-col overflow-hidden shadow-lg transition-transform lg:visible lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:w-auto lg:translate-x-0 lg:shadow-none lg:transition-none lg:pointer-events-auto",
        side === "left" &&
          (mobileOpen
            ? "left-0 visible translate-x-0"
            : "left-0 invisible -translate-x-full pointer-events-none"),
        side === "right" &&
          (mobileOpen
            ? "right-0 visible translate-x-0"
            : "right-0 invisible translate-x-full pointer-events-none"),
        !visible && "lg:hidden",
        className,
      )}
    >
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </aside>
  );
}

function useDesktopWorkspaceLayout() {
  const [desktopLayout, setDesktopLayout] = useState(() =>
    window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");

    setDesktopLayout(query.matches);

    const syncLayout = (event: MediaQueryListEvent) => {
      setDesktopLayout(event.matches);
    };

    query.addEventListener("change", syncLayout);

    return () => {
      query.removeEventListener("change", syncLayout);
    };
  }, []);

  return desktopLayout;
}

function RightPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            {t("chats.workbench.rightPlaceholder.title")}
          </EmptyTitle>
          <EmptyDescription>
            {t("chats.workbench.rightPlaceholder.description")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
