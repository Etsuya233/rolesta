import { LoaderCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import type { ChatDetail, ChatListItem } from '../api/chats-api';
import { useDeleteChat } from '../hooks/use-chats';

export function ChatDeleteDialog({
  chat,
  open,
  onOpenChange,
  onDeleted,
}: {
  chat: Pick<ChatDetail, 'id' | 'title'> | ChatListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation();
  const mutation = useDeleteChat();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('chats.management.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('chats.management.delete.description', { title: chat?.title ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              if (!chat) return;
              mutation.mutate(chat.id, {
                onSuccess: () => {
                  onDeleted(chat.id);
                  onOpenChange(false);
                },
              });
            }}
          >
            {mutation.isPending ? (
              <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
            ) : null}
            {t('chats.management.actions.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
