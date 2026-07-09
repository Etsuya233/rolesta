import { BotIcon, BugIcon, LibraryIcon, MessageSquarePlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../../components/ui/empty";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Separator } from "../../../components/ui/separator";
import type { WorkspacePanelRuntime } from "../model/workspace-panels";

export function RecentWorkspacePanel({ openPanel }: WorkspacePanelRuntime) {
  const { t } = useTranslation();

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <div className="shrink-0 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              {t("chats.workbench.title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("chats.workbench.recent.description")}
            </p>
          </div>
          <Button type="button" size="sm">
            <MessageSquarePlusIcon data-icon="inline-start" />
            {t("chats.workbench.recent.newChat")}
          </Button>
        </div>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("chats.workbench.recent.recentChats")}
                </CardTitle>
                <CardAction>
                  <Badge variant="secondary">
                    {t("chats.workbench.recent.emptyBadge")}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageSquarePlusIcon />
                    </EmptyMedia>
                    <EmptyTitle>
                      {t("chats.workbench.recent.noRecentChats")}
                    </EmptyTitle>
                    <EmptyDescription>
                      {t("chats.workbench.recent.noRecentChatsDescription")}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent className="flex-row flex-wrap justify-center">
                    <Button type="button" size="sm">
                      {t("chats.workbench.recent.selectChat")}
                    </Button>
                    <Button type="button" variant="outline" size="sm">
                      {t("chats.workbench.recent.createChat")}
                    </Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>

            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">
                {t("chats.workbench.recent.quickOpen")}
              </h2>
              <div className="grid gap-2">
                {quickOpenItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Button
                      key={item.panelKey}
                      type="button"
                      variant="outline"
                      className="h-auto w-full justify-start gap-3 px-3 py-3"
                      onClick={() => openPanel(item.panelKey)}
                    >
                      <Icon data-icon="inline-start" />
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                        <span className="truncate text-sm font-medium">
                          {t(item.titleKey)}
                        </span>
                        <span className="whitespace-normal text-xs leading-5 font-normal text-muted-foreground">
                          {t(item.descriptionKey)}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <RecentBucket
              icon={LibraryIcon}
              title={t("chats.workbench.recent.editedAssets")}
              empty={t("chats.workbench.recent.noEditedAssets")}
            />
            <RecentBucket
              icon={BugIcon}
              title={t("chats.workbench.recent.debugRecords")}
              empty={t("chats.workbench.recent.noDebugRecords")}
            />
          </div>
        </div>
      </ScrollArea>
    </main>
  );
}

function RecentBucket({
  icon: Icon,
  title,
  empty,
}: {
  icon: typeof BotIcon;
  title: string;
  empty: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{empty}</p>
      </CardContent>
    </Card>
  );
}

const quickOpenItems = [
  {
    panelKey: "characters",
    icon: BotIcon,
    titleKey: "chats.workbench.panels.characters",
    descriptionKey: "chats.workbench.recent.openCharacters",
  },
  {
    panelKey: "worldbooks",
    icon: LibraryIcon,
    titleKey: "chats.workbench.panels.worldbooks",
    descriptionKey: "chats.workbench.recent.openWorldbooks",
  },
  {
    panelKey: "presets",
    icon: MessageSquarePlusIcon,
    titleKey: "chats.workbench.panels.presets",
    descriptionKey: "chats.workbench.recent.openPresets",
  },
  {
    panelKey: "modelProviders",
    icon: BotIcon,
    titleKey: "chats.workbench.panels.modelProviders",
    descriptionKey: "chats.workbench.recent.openModelProviders",
  },
] as const;
