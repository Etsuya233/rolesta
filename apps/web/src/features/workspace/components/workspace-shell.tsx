import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "../../../components/ui/empty";
import { cn } from "../../../lib/utils";
import {
  type WorkspaceResizableSide,
  useWorkspaceLayout,
} from "../model/use-workspace-layout";
import type {
  WorkspaceArea,
  WorkspacePanelKey,
  WorkspacePanelRuntime,
} from "../model/workspace-panels";
import { WorkspacePanelHost } from "./workspace-panel-host";
import { WorkspaceToolbar } from "./workspace-toolbar";

const workspaceAreas: WorkspaceArea[] = ["left", "center", "right", "bottom"];
const workspaceCenterMinWidth = 360;
const workspacePanelSizeLimits = {
  left: {
    min: 224,
    max: 448,
  },
  right: {
    min: 320,
    max: 640,
  },
} satisfies Record<WorkspaceResizableSide, { min: number; max: number }>;
const workspacePanelResizeStep = 16;

export function WorkspaceShell() {
  const layout = useWorkspaceLayout();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const desktopLayout = useDesktopWorkspaceLayout();
  const workspaceGridRef = useRef<HTMLDivElement>(null);
  const [resizingSide, setResizingSide] =
    useState<WorkspaceResizableSide | null>(null);
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
      setActiveChatId,
      openPanel: layout.openPanel,
      closeArea: layout.closeArea,
      closeMobileArea: layout.closeMobileArea,
    }),
    [activeChatId, layout.closeArea, layout.closeMobileArea, layout.openPanel],
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
  const workspaceGridStyle = {
    "--workspace-left-column": visibleByArea.left
      ? `${layout.panelSizes.leftWidth}px`
      : "0px",
    "--workspace-right-column": visibleByArea.right
      ? `${layout.panelSizes.rightWidth}px`
      : "0px",
  } as CSSProperties;
  const panelBounds = useCallback(
    (side: WorkspaceResizableSide) => {
      const gridBox = workspaceGridRef.current?.getBoundingClientRect();
      const workspaceWidth = gridBox?.width ?? window.innerWidth;
      const oppositeWidth =
        side === "left" && visibleByArea.right
          ? layout.panelSizes.rightWidth
          : side === "right" && visibleByArea.left
            ? layout.panelSizes.leftWidth
            : 0;
      const configured = workspacePanelSizeLimits[side];
      const workspaceMax = workspaceWidth - oppositeWidth - workspaceCenterMinWidth;
      const max = Math.max(configured.min, Math.min(configured.max, workspaceMax));

      return {
        min: configured.min,
        max,
      };
    },
    [layout.panelSizes.leftWidth, layout.panelSizes.rightWidth, visibleByArea],
  );
  const panelWidthFromPointer = useCallback(
    (side: WorkspaceResizableSide, clientX: number) => {
      const gridBox = workspaceGridRef.current?.getBoundingClientRect();

      if (!gridBox) {
        return layout.panelSizes[side === "left" ? "leftWidth" : "rightWidth"];
      }

      return side === "left" ? clientX - gridBox.left : gridBox.right - clientX;
    },
    [layout.panelSizes],
  );
  const setPanelWidthWithinBounds = useCallback(
    (side: WorkspaceResizableSide, width: number) => {
      const bounds = panelBounds(side);

      layout.setPanelWidth(side, Math.min(bounds.max, Math.max(bounds.min, width)));
    },
    [layout.setPanelWidth, panelBounds],
  );
  const resizePanelFromPointer = useCallback(
    (side: WorkspaceResizableSide, clientX: number) => {
      setPanelWidthWithinBounds(side, panelWidthFromPointer(side, clientX));
    },
    [panelWidthFromPointer, setPanelWidthWithinBounds],
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

      <div
        ref={workspaceGridRef}
        style={workspaceGridStyle}
        data-testid="workspace-grid"
        data-resizing-side={resizingSide ?? undefined}
        className="grid min-h-0 flex-1 grid-cols-1 bg-muted/30 lg:grid-cols-[var(--workspace-left-column)_minmax(0,1fr)_var(--workspace-right-column)]"
      >
        <WorkspaceSideArea
          area="left"
          visible={layout.leftVisible}
          mobileOpen={layout.mobileArea === "left"}
          desktopLayout={desktopLayout}
          side="left"
          className="border-r bg-background lg:col-start-1 lg:bg-sidebar"
          panelWidth={layout.panelSizes.leftWidth}
          panelMinWidth={workspacePanelSizeLimits.left.min}
          panelMaxWidth={panelBounds("left").max}
          resizing={resizingSide === "left"}
          onResizeStart={(event) => {
            setResizingSide("left");
            event.currentTarget.setPointerCapture(event.pointerId);
            resizePanelFromPointer("left", event.clientX);
          }}
          onResizeMove={(event) => {
            if (resizingSide === "left") {
              resizePanelFromPointer("left", event.clientX);
            }
          }}
          onResizeEnd={(event) => {
            if (resizingSide === "left") {
              setResizingSide(null);
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }
          }}
          onResizeKeyDown={(event) => {
            resizePanelFromKeyboard("left", event, layout.panelSizes.leftWidth, (width) => {
              setPanelWidthWithinBounds("left", width);
            });
          }}
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
          className="border-l bg-background lg:col-start-3"
          panelWidth={layout.panelSizes.rightWidth}
          panelMinWidth={workspacePanelSizeLimits.right.min}
          panelMaxWidth={panelBounds("right").max}
          resizing={resizingSide === "right"}
          onResizeStart={(event) => {
            setResizingSide("right");
            event.currentTarget.setPointerCapture(event.pointerId);
            resizePanelFromPointer("right", event.clientX);
          }}
          onResizeMove={(event) => {
            if (resizingSide === "right") {
              resizePanelFromPointer("right", event.clientX);
            }
          }}
          onResizeEnd={(event) => {
            if (resizingSide === "right") {
              setResizingSide(null);
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }
          }}
          onResizeKeyDown={(event) => {
            resizePanelFromKeyboard("right", event, layout.panelSizes.rightWidth, (width) => {
              setPanelWidthWithinBounds("right", width);
            });
          }}
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
  panelWidth,
  panelMinWidth,
  panelMaxWidth,
  resizing,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onResizeKeyDown,
  children,
}: {
  area: WorkspaceArea;
  visible: boolean;
  mobileOpen: boolean;
  desktopLayout: boolean;
  side: "left" | "right";
  className?: string;
  panelWidth: number;
  panelMinWidth: number;
  panelMaxWidth: number;
  resizing: boolean;
  onResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  onResizeMove: (event: PointerEvent<HTMLDivElement>) => void;
  onResizeEnd: (event: PointerEvent<HTMLDivElement>) => void;
  onResizeKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
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
        "fixed bottom-0 top-12 z-40 flex w-screen min-h-0 flex-col overflow-hidden shadow-lg transition-transform lg:visible lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:w-auto lg:translate-x-0 lg:overflow-visible lg:shadow-none lg:transition-none lg:pointer-events-auto lg:relative",
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
      <WorkspaceResizeHandle
        side={side}
        panelWidth={panelWidth}
        panelMinWidth={panelMinWidth}
        panelMaxWidth={panelMaxWidth}
        resizing={resizing}
        onResizeStart={onResizeStart}
        onResizeMove={onResizeMove}
        onResizeEnd={onResizeEnd}
        onResizeKeyDown={onResizeKeyDown}
      />
    </aside>
  );
}

function WorkspaceResizeHandle({
  side,
  panelWidth,
  panelMinWidth,
  panelMaxWidth,
  resizing,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onResizeKeyDown,
}: {
  side: WorkspaceResizableSide;
  panelWidth: number;
  panelMinWidth: number;
  panelMaxWidth: number;
  resizing: boolean;
  onResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
  onResizeMove: (event: PointerEvent<HTMLDivElement>) => void;
  onResizeEnd: (event: PointerEvent<HTMLDivElement>) => void;
  onResizeKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={`Resize ${side} panel`}
      aria-orientation="vertical"
      aria-valuemin={panelMinWidth}
      aria-valuemax={panelMaxWidth}
      aria-valuenow={panelWidth}
      data-testid={`workspace-${side}-resize-handle`}
      data-resizing={resizing}
      onPointerDown={onResizeStart}
      onPointerMove={onResizeMove}
      onPointerUp={onResizeEnd}
      onLostPointerCapture={onResizeEnd}
      onKeyDown={onResizeKeyDown}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-ring/60 after:opacity-0 after:transition-[background-color,opacity] after:duration-150 hover:after:bg-ring/70 hover:after:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:after:bg-ring/70 focus-visible:after:opacity-100 data-[resizing=true]:after:bg-ring/70 data-[resizing=true]:after:opacity-100 lg:block",
        side === "left" ? "-right-1" : "-left-1",
      )}
    />
  );
}

function resizePanelFromKeyboard(
  side: WorkspaceResizableSide,
  event: KeyboardEvent<HTMLDivElement>,
  currentWidth: number,
  setPanelWidth: (width: number) => void,
) {
  if (event.key === "Home") {
    event.preventDefault();
    setPanelWidth(0);
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    setPanelWidth(Number.MAX_SAFE_INTEGER);
    return;
  }

  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return;
  }

  event.preventDefault();

  const direction = event.key === "ArrowRight" ? 1 : -1;
  const sideDirection = side === "left" ? direction : -direction;

  setPanelWidth(currentWidth + sideDirection * workspacePanelResizeStep);
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
