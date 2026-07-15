import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { notify } from "../../../lib/notifications/notify";
import type { WorkspacePanelRuntime } from "../../workspace/model/workspace-panels";
import { getChat, type ChatDetail, type ChatListItem } from "../api/chats-api";
import { ChatDeleteDialog } from "./chat-delete-dialog";
import { ChatFormDialog } from "./chat-form-dialog";
import { ChatListTab } from "./chat-list-tab";
import { CurrentChatTab } from "./current-chat-tab";

export function ChatSidebar({
  activeChatId,
  setActiveChatId,
  closeMobileArea,
}: WorkspacePanelRuntime) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"list" | "current">("list");
  const [formOpen, setFormOpen] = useState(false);
  const [formChat, setFormChat] = useState<ChatDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatDetail | ChatListItem | null>(null);

  const clearActive = useCallback(() => {
    setActiveChatId(null);
    setTab("list");
  }, [setActiveChatId]);

  async function edit(id: string) {
    try {
      setFormChat(await getChat(id));
      setFormOpen(true);
    } catch {
      notify.error({ title: t("chats.management.loadFailed") });
    }
  }

  return (
    <aside className="h-full min-h-0 bg-background text-foreground lg:bg-sidebar lg:text-sidebar-foreground">
      <Tabs value={tab} onValueChange={(value) => setTab(value as "list" | "current")} className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <TabsList className="m-2 grid w-auto grid-cols-2">
          <TabsTrigger value="list">{t("chats.management.tabs.list")}</TabsTrigger>
          <TabsTrigger value="current">{t("chats.management.tabs.current")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="min-h-0 overflow-hidden">
          <ChatListTab
            activeChatId={activeChatId}
            onCreate={() => { setFormChat(null); setFormOpen(true); }}
            onSelect={(id) => { setActiveChatId(id); setTab("current"); closeMobileArea(); }}
            onEdit={edit}
            onDelete={setDeleteTarget}
          />
        </TabsContent>
        <TabsContent value="current" className="min-h-0 overflow-hidden">
          <CurrentChatTab activeChatId={activeChatId} onEdit={(chat) => { setFormChat(chat); setFormOpen(true); }} onDelete={setDeleteTarget} onNotFound={clearActive} />
        </TabsContent>
      </Tabs>
      <ChatFormDialog
        open={formOpen}
        chat={formChat}
        onOpenChange={setFormOpen}
        onCreated={(chat) => { setActiveChatId(chat.id); setTab("current"); closeMobileArea(); }}
      />
      <ChatDeleteDialog
        chat={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onDeleted={(id) => { if (id === activeChatId) clearActive(); }}
      />
    </aside>
  );
}
