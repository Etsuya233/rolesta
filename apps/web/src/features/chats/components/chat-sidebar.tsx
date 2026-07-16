import { useCallback, useState } from 'react';
import { KeepAliveStackViewport } from '../../../components/keep-alive-stack/keep-alive-stack-viewport';
import { useKeepAliveStack } from '../../../components/keep-alive-stack/use-keep-alive-stack';
import type { WorkspacePanelRuntime } from '../../workspace/model/workspace-panels';
import type { ChatDetail, ChatListItem } from '../api/chats-api';
import { ChatDeleteDialog } from './chat-delete-dialog';
import { ChatCreatePage, ChatEditPage } from './chat-form-page';
import { ChatHomePage } from './chat-home-page';
import { chatHomePage, createChatPage, editChatPage, type ChatHomeTab } from './chat-pages';

export function ChatSidebar({
  activeChatId,
  setActiveChatId,
  closeMobileArea,
}: WorkspacePanelRuntime) {
  const [tab, setTab] = useState<ChatHomeTab>('list');
  const [deleteTarget, setDeleteTarget] = useState<ChatDetail | ChatListItem | null>(null);
  const { pages, activePage, pushPage, popPage } = useKeepAliveStack(chatHomePage);

  const clearActive = useCallback(() => {
    setActiveChatId(null);
    setTab('list');
  }, [setActiveChatId]);

  function edit(id: string) {
    pushPage(editChatPage(id, tab));
  }

  return (
    <aside className="flex h-full min-h-0 flex-col bg-background text-foreground lg:bg-sidebar lg:text-sidebar-foreground">
      <KeepAliveStackViewport
        activeKey={activePage.key}
        pages={pages}
        renderPage={(page) => {
          if (page.name === 'home') {
            return (
              <ChatHomePage
                activeChatId={activeChatId}
                tab={tab}
                onCreate={() => pushPage(createChatPage())}
                onDelete={setDeleteTarget}
                onEdit={edit}
                onNotFound={clearActive}
                onSelect={(id) => {
                  setActiveChatId(id);
                  setTab('current');
                  closeMobileArea();
                }}
                onTabChange={setTab}
              />
            );
          }

          if (page.name === 'create') {
            return (
              <ChatCreatePage
                onBack={popPage}
                onCreated={(chat) => {
                  setActiveChatId(chat.id);
                  setTab('current');
                  popPage();
                  closeMobileArea();
                }}
              />
            );
          }

          return (
            <ChatEditPage
              chatId={page.chatId}
              onBack={popPage}
              onNotFound={() => {
                if (page.chatId === activeChatId) clearActive();
                else setTab(page.origin);
                popPage();
              }}
              onUpdated={() => {
                setTab(page.origin);
                popPage();
              }}
            />
          );
        }}
      />
      <ChatDeleteDialog
        chat={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={(id) => {
          if (id === activeChatId) clearActive();
        }}
      />
    </aside>
  );
}
