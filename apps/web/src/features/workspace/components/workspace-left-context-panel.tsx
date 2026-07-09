import { PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "../../../components/ui/empty";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Separator } from "../../../components/ui/separator";
import type { WorkspacePanelRuntime } from "../model/workspace-panels";

export function WorkspaceLeftContextPanel({ openPanel }: WorkspacePanelRuntime) {
  const { t } = useTranslation();

  return (
    <aside className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">
            {t("chats.workbench.context.title")}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {t("chats.workbench.context.noChat")}
          </p>
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={t("chats.workbench.context.createChat")}
        >
          <PlusIcon />
        </Button>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle>
                {t("chats.workbench.context.chatList")}
              </CardTitle>
              <CardDescription>
                {t("chats.workbench.context.noChat")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Empty className="p-3">
                <EmptyHeader>
                  <EmptyTitle>
                    {t("chats.workbench.context.emptyChats")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t("chats.workbench.context.emptyChatsDescription")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              {t("chats.workbench.context.currentContext")}
            </h3>
            <div className="grid gap-2">
              {contextRows.map((row) => (
                <div
                  key={row.labelKey}
                  className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
                >
                  <span className="truncate text-xs text-muted-foreground">
                    {t(row.labelKey)}
                  </span>
                  <Badge variant="outline">
                    {t("chats.workbench.context.unselected")}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              {t("chats.workbench.context.assets")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openPanel("characters")}
              >
                {t("chats.workbench.panels.characters")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openPanel("worldbooks")}
              >
                {t("chats.workbench.panels.worldbooks")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openPanel("presets")}
              >
                {t("chats.workbench.panels.presets")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openPanel("modelProviders")}
              >
                {t("chats.workbench.panels.modelProviders")}
              </Button>
            </div>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}

const contextRows = [
  { labelKey: "chats.workbench.context.character" },
  { labelKey: "chats.workbench.context.persona" },
  { labelKey: "chats.workbench.context.preset" },
  { labelKey: "chats.workbench.context.modelProfile" },
  { labelKey: "chats.workbench.context.worldbooks" },
];
