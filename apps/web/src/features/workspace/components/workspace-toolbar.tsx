import { PanelLeftIcon, PanelRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { cn } from "../../../lib/utils";
import {
  workspacePanelDefinitions,
  type WorkspacePanelKey,
} from "../model/workspace-panels";

interface WorkspaceToolbarProps {
  activePanelKeys: Set<WorkspacePanelKey>;
  leftVisible: boolean;
  rightVisible: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onOpenPanel: (panelKey: WorkspacePanelKey) => void;
}

export function WorkspaceToolbar({
  activePanelKeys,
  leftVisible,
  rightVisible,
  onToggleLeft,
  onToggleRight,
  onOpenPanel,
}: WorkspaceToolbarProps) {
  const { t } = useTranslation();
  const toolbarPanels = [...workspacePanelDefinitions].sort(
    (left, right) => left.toolbarOrder - right.toolbarOrder,
  );
  const toolbarButtonClassName =
    "active:not-aria-[haspopup]:translate-y-0";

  return (
    <TooltipProvider>
      <header
        data-testid="workspace-toolbar"
        className="flex h-12 shrink-0 items-center overflow-hidden border-b bg-background px-2"
      >
      <div className="flex shrink-0 items-center gap-1">
        <ToolbarTooltip label={t("chats.workbench.toolbar.toggleLeft")}>
          <Button
            type="button"
            variant={leftVisible ? "secondary" : "ghost"}
            size="icon-sm"
            aria-pressed={leftVisible}
            aria-label={t("chats.workbench.toolbar.toggleLeft")}
            onClick={onToggleLeft}
            className={toolbarButtonClassName}
          >
            <PanelLeftIcon />
          </Button>
        </ToolbarTooltip>
      </div>

      <nav
        aria-label={t("chats.workbench.toolbar.panelNavigation")}
        data-testid="workspace-toolbar-panels"
        className="flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto overflow-y-hidden px-2"
      >
        {toolbarPanels.map((panel) => {
          const Icon = panel.icon;
          const active = activePanelKeys.has(panel.key);
          const label = t(panel.labelKey);

          return (
            <ToolbarTooltip key={panel.key} label={label}>
              <Button
                type="button"
                variant={active ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={active}
                aria-label={label}
                data-testid={`workspace-toolbar-panel-${panel.key}`}
                onClick={() => onOpenPanel(panel.key)}
                className={cn(
                  "shrink-0 max-lg:size-7 max-lg:gap-0 max-lg:px-0 max-lg:has-data-[icon=inline-start]:pl-0",
                  toolbarButtonClassName,
                  active && "border-border",
                )}
              >
                <Icon data-icon="inline-start" />
                <span className="hidden lg:inline">{label}</span>
              </Button>
            </ToolbarTooltip>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center justify-end gap-1">
        <ToolbarTooltip label={t("chats.workbench.toolbar.toggleRight")}>
          <Button
            type="button"
            variant={rightVisible ? "secondary" : "ghost"}
            size="icon-sm"
            aria-pressed={rightVisible}
            aria-label={t("chats.workbench.toolbar.toggleRight")}
            onClick={onToggleRight}
            className={toolbarButtonClassName}
          >
            <PanelRightIcon />
          </Button>
        </ToolbarTooltip>
      </div>
      </header>
    </TooltipProvider>
  );
}

function ToolbarTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
