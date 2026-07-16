import { PlusIcon, RotateCwIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group';
import { ScrollArea } from '../../../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { PageControls } from '../../assets/components/page-controls';
import { AssetSortPopover } from '../../assets/components/asset-sort-popover';
import { listCharacters } from '../../characters/api/characters-api';
import { useQuery } from '@tanstack/react-query';
import type { ChatListItem as ChatListItemData } from '../api/chats-api';
import { useChats } from '../hooks/use-chats';
import { ChatListItem } from './chat-list-item';

export function ChatListTab({
  activeChatId,
  onCreate,
  onSelect,
  onEdit,
  onDelete,
}: {
  activeChatId: string | null;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (chat: ChatListItemData) => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [sortKey, setSortKey] = useState<'createdAt' | 'updatedAt' | 'title'>('updatedAt');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<10 | 20 | 50 | 100>(20);
  const query = useChats({ q, role, sort: sortKey, direction, pageIndex, pageSize });
  const characters = useQuery({
    queryKey: ['chat-list', 'characters'],
    queryFn: () =>
      listCharacters({
        scope: 'all',
        sort: 'name',
        direction: 'asc',
        pageIndex: 0,
        pageSize: 100,
        q: '',
      }),
  });
  const sortOptions: Array<{
    value: 'createdAt' | 'updatedAt' | 'title';
    label: string;
  }> = [
    { value: 'updatedAt', label: t('chats.management.sort.updatedAt') },
    { value: 'createdAt', label: t('chats.management.sort.createdAt') },
    { value: 'title', label: t('chats.management.sort.title') },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput
              value={q}
              aria-label={t('chats.management.search')}
              placeholder={t('chats.management.search')}
              onChange={(event) => {
                setQ(event.target.value);
                setPageIndex(0);
              }}
            />
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
          </InputGroup>
          <Button
            type="button"
            size="icon"
            aria-label={t('chats.management.create')}
            onClick={onCreate}
          >
            <PlusIcon />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={role}
            onValueChange={(value) => {
              setRole(value);
              setPageIndex(0);
            }}
          >
            <SelectTrigger aria-label={t('chats.management.roleFilter')} className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t('chats.management.filters.all')}</SelectItem>
                <SelectItem value="missing">{t('chats.management.filters.missing')}</SelectItem>
                {(characters.data?.items ?? []).map((character) => (
                  <SelectItem key={character.id} value={character.id}>
                    {character.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <AssetSortPopover
            active={sortKey !== 'updatedAt' || direction !== 'desc'}
            buttonLabel={t('chats.management.sort.label')}
            direction={direction}
            options={sortOptions}
            sort={sortKey}
            onDirectionChange={(value) => {
              setPageIndex(0);
              setDirection(value);
            }}
            onSortChange={(value) => {
              setPageIndex(0);
              setSortKey(value);
            }}
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {query.isError ? (
          <Empty className="p-6">
            <EmptyHeader>
              <EmptyTitle>{t('chats.management.loadFailed')}</EmptyTitle>
              <EmptyDescription>{t('chats.management.loadFailedDescription')}</EmptyDescription>
            </EmptyHeader>
            <Button type="button" variant="outline" onClick={() => void query.refetch()}>
              <RotateCwIcon data-icon="inline-start" />
              {t('chats.management.retry')}
            </Button>
          </Empty>
        ) : query.isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">{t('chats.management.loading')}</div>
        ) : query.data?.items.length === 0 ? (
          <Empty className="p-6">
            <EmptyHeader>
              <EmptyTitle>{t('chats.management.empty')}</EmptyTitle>
              <EmptyDescription>{t('chats.management.emptyDescription')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          query.data?.items.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeChatId}
              onSelect={() => onSelect(chat.id)}
              onEdit={() => onEdit(chat.id)}
              onDelete={() => onDelete(chat)}
            />
          ))
        )}
      </ScrollArea>
      <div className="shrink-0 border-t p-3">
        <PageControls
          compact
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalPages={query.data?.totalPages ?? 0}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(value) => {
            setPageSize(value as 10 | 20 | 50 | 100);
            setPageIndex(0);
          }}
        />
      </div>
    </div>
  );
}
