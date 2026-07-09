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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../../components/ui/sheet";
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
          className="border-r bg-sidebar lg:w-72"
        >
          <WorkspacePanelHost
            area="left"
            openedKeys={layout.openedByArea.left}
            activeKey={layout.activeByArea.left}
            runtime={runtime}
          />
        </WorkspaceSideArea>

        <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-background">
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
          className="border-l bg-background lg:w-[28rem] xl:w-[32rem]"
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
  if (!desktopLayout) {
    return (
      <Sheet
        open={mobileOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <SheetContent
          side={side}
          showCloseButton={false}
          data-testid={`workspace-${area}-column`}
          data-visible={visible}
          data-mobile-open={mobileOpen}
          className={cn(
            "w-[min(24rem,calc(100vw-2rem))] gap-0 p-0 sm:max-w-none",
            className,
          )}
        >
          <SheetHeader className="flex h-12 shrink-0 flex-row items-center justify-between gap-3 border-b px-3 py-0">
            <SheetTitle className="truncate text-sm font-semibold">
              {title}
            </SheetTitle>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={title}
              >
                <XIcon />
              </Button>
            </SheetClose>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      data-testid={`workspace-${area}-column`}
      data-visible={visible}
      data-mobile-open={mobileOpen}
      className={cn(
        "hidden min-h-0 flex-col overflow-hidden lg:flex",
        !visible && "lg:hidden",
        className,
      )}
    >
      {children}
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
