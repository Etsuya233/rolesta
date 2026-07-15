import { MoreHorizontalIcon, PencilIcon, Trash2Icon, UserRoundXIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { cn } from '../../../lib/utils';
import type { ChatListItem as ChatListItemData } from '../api/chats-api';

export function ChatListItem({
  chat,
  active,
  onSelect,
  onEdit,
  onDelete,
}: {
  chat: ChatListItemData;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const character = chat.chatCharacter;
  const avatarSource = character?.avatar?.sources['64'] ?? character?.avatar?.sources['128'];

  return (
    <div
      className={cn(
        'group flex min-h-16 items-center border-b border-border',
        active && 'bg-accent',
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
        onClick={onSelect}
      >
        <Avatar>
          {avatarSource ? <AvatarImage src={avatarSource} alt={character?.name ?? ''} /> : null}
          <AvatarFallback>
            {character ? character.name.slice(0, 1).toUpperCase() : <UserRoundXIcon />}
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{chat.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {character?.name ?? t('chats.management.missingCharacter')}
          </span>
          <time
            className="text-xs text-muted-foreground"
            dateTime={new Date(chat.updatedAtMs).toISOString()}
          >
            {new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(chat.updatedAtMs)}
          </time>
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={t('chats.management.actions.menu')}
            className="mr-2 shrink-0"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={onEdit}>
              <PencilIcon />
              {t('chats.management.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon />
              {t('chats.management.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
