import {MessageSquarePlusIcon} from "lucide-react";
import {useTranslation} from "react-i18next";
import {Button} from "../../../components/ui/button";
import type {WorkspacePanelRuntime} from "../model/workspace-panels";

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
    </main>
  );
}