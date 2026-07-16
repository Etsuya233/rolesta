import { RotateCwIcon, SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from '../../../components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group';
import { Skeleton } from '../../../components/ui/skeleton';

export function AssetSelectionDialog({
  open,
  title,
  description,
  search,
  selectedLabel,
  toolbar,
  pagination,
  allowClear,
  confirmDisabled = false,
  children,
  onSearchChange,
  onOpenChange,
  onClear,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  search: string;
  selectedLabel: string;
  toolbar?: ReactNode;
  pagination: ReactNode;
  allowClear: boolean;
  confirmDisabled?: boolean;
  children: ReactNode;
  onSearchChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onClear: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-4xl grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] gap-0 p-0 sm:h-[min(46rem,calc(100dvh-2rem))] sm:max-h-[calc(100dvh-2rem)]">
        <DialogHeader className="border-b px-4 py-3 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput
              aria-label={t('chats.management.picker.search')}
              placeholder={t('chats.management.picker.search')}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
          </InputGroup>
          {toolbar}
        </div>

        <div className="min-h-0 overflow-y-auto">{children}</div>

        <div className="shrink-0 border-t px-4 py-2.5">{pagination}</div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-lg px-4 py-3">
          <div className="flex w-full flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {selectedLabel}
            </span>
            {allowClear ? (
              <Button type="button" variant="ghost" onClick={onClear}>
                {t('chats.management.picker.clear')}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={confirmDisabled} onClick={onConfirm}>
              {t('chats.management.picker.confirm')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssetSelectionContentState({
  loading,
  error,
  empty,
  children,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  children: ReactNode;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-label={t('chats.management.picker.loading')}>
        {Array.from({ length: 6 }, (_, index) => (
          <div className="flex items-center gap-3" key={index}>
            <Skeleton className="size-10 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Empty className="h-full min-h-64">
        <EmptyHeader>
          <EmptyDescription>{t('chats.management.picker.loadFailed')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" variant="outline" onClick={onRetry}>
            <RotateCwIcon data-icon="inline-start" />
            {t('chats.management.retry')}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (empty) {
    return (
      <Empty className="h-full min-h-64">
        <EmptyHeader>
          <EmptyDescription>{t('chats.management.picker.empty')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return children;
}
