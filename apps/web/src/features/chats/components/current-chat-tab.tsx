import {
  CableIcon,
  PencilIcon,
  RotateCwIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UserRoundIcon,
  UserRoundXIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import { ApiError } from '../../../lib/api/client';
import type { ChatDetail } from '../api/chats-api';
import { useChat } from '../hooks/use-chats';
import { formatModelProviderKind } from './model-provider-kind-label';

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
      <div className="flex shrink-0 items-start gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-sm font-semibold">{chat.title}</h2>
          <p className="truncate text-xs text-muted-foreground">{chat.id}</p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t('chats.management.actions.edit')}
          onClick={() => onEdit(chat)}
        >
          <PencilIcon />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t('chats.management.actions.delete')}
          onClick={() => onDelete(chat)}
        >
          <Trash2Icon />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col p-4">
          {!chat.chatCharacter ? (
            <Alert className="mb-3">
              <UserRoundXIcon />
              <AlertDescription>{t('chats.management.current.missingCharacter')}</AlertDescription>
            </Alert>
          ) : null}
          <CurrentAssetRow
            avatar={chat.chatCharacter?.avatar ?? null}
            icon={UserRoundIcon}
            label={t('chats.management.form.character')}
            name={chat.chatCharacter?.name}
          />
          <CurrentAssetRow
            avatar={chat.persona?.avatar ?? null}
            icon={UserRoundIcon}
            label={t('chats.management.form.persona')}
            name={chat.persona?.name}
          />
          <CurrentAssetRow
            icon={SlidersHorizontalIcon}
            label={t('chats.management.form.preset')}
            name={chat.preset?.name}
          />
          <CurrentAssetRow
            icon={CableIcon}
            label={t('chats.management.form.modelProvider')}
            name={chat.modelProvider?.name}
            detail={
              chat.modelProvider
                ? [
                    formatModelProviderKind(chat.modelProvider.providerKind),
                    chat.modelProvider.defaultModelName,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined
            }
          />
          <Separator className="my-3" />
          <div className="flex flex-col gap-3">
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
        </div>
      </ScrollArea>
    </div>
  );
}

function CurrentAssetRow({
  label,
  name,
  detail,
  avatar,
  icon: Icon,
}: {
  label: string;
  name?: string | undefined;
  detail?: string | undefined;
  avatar?: { resourceId: string; sources: Record<string, string> } | null | undefined;
  icon: LucideIcon;
}) {
  const { t } = useTranslation();
  const avatarSource = avatar?.sources['64'] ?? avatar?.sources['128'];

  return (
    <div className="flex min-w-0 items-center gap-3 py-2.5">
      {avatar ? (
        <Avatar size="lg">
          {avatarSource ? <AvatarImage alt={name ?? ''} src={avatarSource} /> : null}
          <AvatarFallback>{name?.slice(0, 1).toUpperCase() ?? <Icon />}</AvatarFallback>
        </Avatar>
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium">
          {name ?? t('chats.management.form.unselected')}
        </span>
        {detail ? <span className="truncate text-xs text-muted-foreground">{detail}</span> : null}
      </span>
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
        <span className="break-words">{value ?? t('chats.management.form.unselected')}</span>
        {detail ? <span className="block text-xs text-muted-foreground">{detail}</span> : null}
      </span>
    </div>
  );
}
