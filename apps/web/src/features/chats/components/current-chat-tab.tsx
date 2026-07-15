import { PencilIcon, RotateCwIcon, Trash2Icon, UserRoundXIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import { ApiError } from '../../../lib/api/client';
import type { ChatDetail } from '../api/chats-api';
import { useChat } from '../hooks/use-chats';

export function CurrentChatTab({
  activeChatId,
  onEdit,
  onDelete,
  onNotFound,
}: {
  activeChatId: string | null;
  onEdit: (chat: ChatDetail) => void;
  onDelete: (chat: ChatDetail) => void;
  onNotFound: () => void;
}) {
  const { t, i18n } = useTranslation();
  const query = useChat(activeChatId);

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.rawResponse?.status === 404) onNotFound();
  }, [onNotFound, query.error]);

  if (!activeChatId) {
    return (
      <Empty className="h-full p-6">
        <EmptyHeader>
          <EmptyTitle>{t('chats.management.current.none')}</EmptyTitle>
          <EmptyDescription>{t('chats.management.current.noneDescription')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  if (query.isError) {
    return (
      <Empty className="h-full p-6">
        <EmptyHeader>
          <EmptyTitle>{t('chats.management.loadFailed')}</EmptyTitle>
          <EmptyDescription>{t('chats.management.current.loadFailedDescription')}</EmptyDescription>
        </EmptyHeader>
        <Button type="button" variant="outline" onClick={() => void query.refetch()}>
          <RotateCwIcon data-icon="inline-start" />
          {t('chats.management.retry')}
        </Button>
      </Empty>
    );
  }
  if (!query.data)
    return <div className="p-4 text-sm text-muted-foreground">{t('chats.management.loading')}</div>;
  const chat = query.data;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start gap-2 border-b p-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-sm font-semibold">{chat.title}</h2>
          <p className="truncate text-xs text-muted-foreground">{chat.id}</p>
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={t('chats.management.actions.edit')}
          onClick={() => onEdit(chat)}
        >
          <PencilIcon />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={t('chats.management.actions.delete')}
          onClick={() => onDelete(chat)}
        >
          <Trash2Icon />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-3">
          {!chat.chatCharacter ? (
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
              <UserRoundXIcon />
              {t('chats.management.current.missingCharacter')}
            </div>
          ) : null}
          <DetailRow
            label={t('chats.management.form.character')}
            value={chat.chatCharacter?.name}
          />
          <DetailRow label={t('chats.management.form.persona')} value={chat.persona?.name} />
          <DetailRow label={t('chats.management.form.preset')} value={chat.preset?.name} />
          <DetailRow
            label={t('chats.management.form.modelProvider')}
            value={chat.modelProvider?.name}
            detail={chat.modelProvider?.defaultModelName}
          />
          <Separator />
          <DetailRow
            label={t('chats.management.current.createdAt')}
            value={new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(chat.createdAtMs)}
          />
          <DetailRow
            label={t('chats.management.current.updatedAt')}
            value={new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(chat.updatedAtMs)}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

function DetailRow({
  label,
  value,
  detail,
}: {
  label: string;
  value?: string | undefined;
  detail?: string | undefined;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm">
        <span className="break-words">
          {value ?? <Badge variant="outline">{t('chats.management.form.unselected')}</Badge>}
        </span>
        {detail ? <span className="block text-xs text-muted-foreground">{detail}</span> : null}
      </span>
    </div>
  );
}
