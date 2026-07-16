import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import type { ChatDetail, ChatListItem } from '../api/chats-api';
import { ChatListTab } from './chat-list-tab';
import type { ChatHomeTab } from './chat-pages';
import { CurrentChatTab } from './current-chat-tab';

export function ChatHomePage({
  tab,
  activeChatId,
  onTabChange,
  onCreate,
  onSelect,
  onEdit,
  onDelete,
  onNotFound,
}: {
  tab: ChatHomeTab;
  activeChatId: string | null;
  onTabChange: (tab: ChatHomeTab) => void;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (chat: ChatDetail | ChatListItem) => void;
  onNotFound: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Tabs
      className="flex h-full min-h-0 flex-col gap-0"
      value={tab}
      onValueChange={(value) => onTabChange(value as ChatHomeTab)}
    >
      <div className="shrink-0 px-4 pt-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">{t('chats.management.tabs.list')}</TabsTrigger>
          <TabsTrigger value="current">{t('chats.management.tabs.current')}</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        forceMount
        value="list"
        className="min-h-0 overflow-hidden data-[state=inactive]:hidden"
      >
        <ChatListTab
          activeChatId={activeChatId}
          onCreate={onCreate}
          onDelete={onDelete}
          onEdit={onEdit}
          onSelect={onSelect}
        />
      </TabsContent>
      <TabsContent
        forceMount
        value="current"
        className="min-h-0 overflow-hidden data-[state=inactive]:hidden"
      >
        <CurrentChatTab
          activeChatId={activeChatId}
          onDelete={onDelete}
          onEdit={(chat) => onEdit(chat.id)}
          onNotFound={onNotFound}
        />
      </TabsContent>
    </Tabs>
  );
}
