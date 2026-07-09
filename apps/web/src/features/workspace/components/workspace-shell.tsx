import { XIcon } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "../../../components/ui/empty";
import { cn } from "../../../lib/utils";
import { useWorkspaceLayout } from "../model/use-workspace-layout";
import type { WorkspaceArea, WorkspacePanelRuntime } from "../model/workspace-panels";
import { WorkspacePanelHost } from "./workspace-panel-host";
import { WorkspaceToolbar } from "./workspace-toolbar";

interface WorkspaceShellProps {
  activeChatId?: string | undefined;
}

export function WorkspaceShell({ activeChatId }: WorkspaceShellProps) {
  const { t } = useTranslation();
  const layout = useWorkspaceLayout();
  const desktopLayout = useDesktopWorkspaceLayout();
  const runtime = useMemo<WorkspacePanelRuntime>(
    () => ({
      activeChatId,
      openPanel: layout.openPanel,
      closeArea: layout.closeArea,
    }),
    [activeChatId, layout.closeArea, layout.openPanel],
  );

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <WorkspaceToolbar
        activeByArea={layout.activeByArea}
        leftVisible={layout.leftVisible}
        rightVisible={layout.rightVisible}
        onToggleLeft={layout.toggleLeft}
        onToggleRight={layout.toggleRight}
        onOpenPanel={layout.openPanel}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 bg-muted/30 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <WorkspaceSideArea
          area="left"
          title={t("chats.workbench.mobile.leftTitle")}
          visible={layout.leftVisible}
          mobileOpen={layout.mobileArea === "left"}
          desktopLayout={desktopLayout}
          side="left"
          onClose={layout.closeMobileArea}
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
          title={t("chats.workbench.mobile.rightTitle")}
          visible={layout.rightVisible}
          mobileOpen={layout.mobileArea === "right"}
          desktopLayout={desktopLayout}
          side="right"
          onClose={layout.closeMobileArea}
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
  title,
  visible,
  mobileOpen,
  desktopLayout,
  side,
  onClose,
  className,
  children,
}: {
  area: WorkspaceArea;
  title: string;
  visible: boolean;
  mobileOpen: boolean;
  desktopLayout: boolean;
  side: "left" | "right";
  onClose: () => void;
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
        "fixed bottom-0 top-12 z-40 flex w-screen min-h-0 flex-col overflow-hidden shadow-lg transition-transform duration-200 ease-in-out lg:visible lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:w-auto lg:translate-x-0 lg:shadow-none lg:transition-none lg:pointer-events-auto",
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
      <div className="flex h-12 shrink-0 flex-row items-center justify-between gap-3 border-b px-3 lg:hidden">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={title}
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
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
