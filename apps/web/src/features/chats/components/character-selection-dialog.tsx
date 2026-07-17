import { useQuery } from '@tanstack/react-query';
import { CheckIcon, Grid2X2Icon, ListIcon } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
import { cn } from '../../../lib/utils';
import { AssetPermissionFilterMenu } from '../../assets/components/asset-permission-filter-menu';
import { PageControls } from '../../assets/components/page-controls';
import { AssetSortPopover } from '../../assets/components/asset-sort-popover';
import { AssetTagList } from '../../assets/components/asset-tag-list';
import { AssetDefaultBadge } from '../../chat-preferences/components/asset-default-badge';
import {
  listCharacters,
  type CharacterListScope,
  type CharacterSortKey,
  type SortDirection,
} from '../../characters/api/characters-api';
import { AssetSelectionContentState, AssetSelectionDialog } from './asset-selection-dialog';
import type { CharacterAssetSelection } from './chat-asset-selections';

type CharacterView = 'list' | 'grid';
const characterViewStorageKey = 'rolesta.chat.character-picker.view.v1';

export function CharacterSelectionDialog({
  open,
  purpose,
  selectedId,
  value,
  defaultPersonaId,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  purpose: 'character' | 'persona';
  selectedId: string | null;
  value: CharacterAssetSelection | null;
  defaultPersonaId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: CharacterAssetSelection | null) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [scope, setScope] = useState<CharacterListScope>('all');
  const [sort, setSort] = useState<CharacterSortKey>('name');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [pending, setPending] = useState<CharacterAssetSelection | null>(value);
  const [pendingId, setPendingId] = useState<string | null>(selectedId);
  const [view, setView] = useState<CharacterView>(() =>
    window.localStorage.getItem(characterViewStorageKey) === 'grid' ? 'grid' : 'list',
  );

  useEffect(() => {
    if (open) {
      setPending(value);
      setPendingId(selectedId);
    }
  }, [open, selectedId, value]);

  const query = useQuery({
    enabled: open,
    queryKey: [
      'chat-asset-picker',
      'characters',
      { q: deferredSearch, scope, sort, direction, pageIndex, pageSize },
    ],
    queryFn: () =>
      listCharacters({
        q: deferredSearch,
        scope,
        sort,
        direction,
        pageIndex,
        pageSize,
      }),
  });
  const sortOptions: Array<{ value: CharacterSortKey; label: string }> = [
    { value: 'name', label: t('characters.list.sort.name') },
    { value: 'updatedAt', label: t('characters.list.sort.updatedAt') },
    { value: 'createdAt', label: t('characters.list.sort.createdAt') },
    { value: 'lastUsedAt', label: t('characters.list.sort.lastUsedAt') },
    { value: 'usageCount', label: t('characters.list.sort.usageCount') },
  ];
  const title = t(
    purpose === 'character'
      ? 'chats.management.picker.characterTitle'
      : 'chats.management.picker.personaTitle',
  );

  return (
    <AssetSelectionDialog
      allowClear={purpose === 'persona'}
      confirmDisabled={purpose === 'character' && pendingId === null}
      open={open}
      pagination={
        <PageControls
          compact
          pageIndex={query.data?.pageIndex ?? pageIndex}
          pageSize={query.data?.pageSize ?? pageSize}
          pageSizeOptions={[10, 20, 50]}
          totalPages={query.data?.totalPages ?? 1}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(value) => {
            setPageIndex(0);
            setPageSize(value);
          }}
        />
      }
      search={search}
      selectedLabel={
        pending?.name
          ? t('chats.management.picker.selected', { name: pending.name })
          : pendingId
            ? t('chats.management.form.assetLoading')
            : t('chats.management.form.unselected')
      }
      title={title}
      toolbar={
        <>
          <AssetPermissionFilterMenu
            buttonLabel={t('characters.list.filterButton')}
            scope={scope}
            onScopeChange={(value) => {
              setPageIndex(0);
              setScope(value);
            }}
          />
          <AssetSortPopover
            active={sort !== 'name' || direction !== 'asc'}
            buttonLabel={t('chats.management.picker.sort')}
            direction={direction}
            options={sortOptions}
            sort={sort}
            onDirectionChange={(value) => {
              setPageIndex(0);
              setDirection(value);
            }}
            onSortChange={(value) => {
              setPageIndex(0);
              setSort(value);
            }}
          />
          <ToggleGroup
            aria-label={t('chats.management.picker.view')}
            spacing={0}
            type="single"
            value={view}
            variant="outline"
            onValueChange={(value) => {
              if (value !== 'list' && value !== 'grid') return;
              setView(value);
              window.localStorage.setItem(characterViewStorageKey, value);
            }}
          >
            <ToggleGroupItem
              aria-label={t('chats.management.picker.listView')}
              title={t('chats.management.picker.listView')}
              value="list"
            >
              <ListIcon />
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label={t('chats.management.picker.gridView')}
              title={t('chats.management.picker.gridView')}
              value="grid"
            >
              <Grid2X2Icon />
            </ToggleGroupItem>
          </ToggleGroup>
        </>
      }
      onClear={() => {
        setPending(null);
        setPendingId(null);
      }}
      onConfirm={() => {
        if (pending || pendingId === null) onConfirm(pending);
        onOpenChange(false);
      }}
      onOpenChange={onOpenChange}
      onSearchChange={(value) => {
        setPageIndex(0);
        setSearch(value);
      }}
    >
      <AssetSelectionContentState
        empty={query.data?.items.length === 0}
        error={query.isError}
        loading={query.isLoading}
        onRetry={() => void query.refetch()}
      >
        {view === 'list' ? (
          <div className="flex flex-col">
            {query.data?.items.map((character) => (
              <CharacterListChoice
                key={character.id}
                character={character}
                selected={character.id === pendingId}
                showDefault={purpose === 'persona' && character.id === defaultPersonaId}
                onSelect={() => {
                  setPending(character);
                  setPendingId(character.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
            {query.data?.items.map((character) => (
              <CharacterGridChoice
                key={character.id}
                character={character}
                selected={character.id === pendingId}
                showDefault={purpose === 'persona' && character.id === defaultPersonaId}
                onSelect={() => {
                  setPending(character);
                  setPendingId(character.id);
                }}
              />
            ))}
          </div>
        )}
      </AssetSelectionContentState>
    </AssetSelectionDialog>
  );
}

function CharacterListChoice({
  character,
  selected,
  showDefault,
  onSelect,
}: {
  character: CharacterAssetSelection;
  selected: boolean;
  showDefault: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const avatarSource = character.avatar?.sources['64'] ?? character.avatar?.sources['128'];

  return (
    <Button
      aria-pressed={selected}
      className="h-auto w-full justify-start rounded-none border-b px-4 py-3 text-left whitespace-normal"
      type="button"
      variant={selected ? 'secondary' : 'ghost'}
      onClick={onSelect}
    >
      <Avatar size="lg">
        {avatarSource ? <AvatarImage alt={character.name} src={avatarSource} /> : null}
        <AvatarFallback>{character.name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{character.name}</span>
          {showDefault ? <AssetDefaultBadge kind="persona" /> : null}
          {character.visibility ? (
            <Badge className="shrink-0" variant="outline">
              {t(
                character.visibility === 'public'
                  ? 'characters.list.publicVisibility'
                  : 'characters.list.privateVisibility',
              )}
            </Badge>
          ) : null}
        </span>
        {character.comment ? (
          <span className="line-clamp-1 text-xs text-muted-foreground">{character.comment}</span>
        ) : null}
        {character.tags ? <AssetTagList maxItems={3} tags={character.tags} /> : null}
      </span>
      <CheckIcon className={cn('shrink-0', !selected && 'invisible')} />
    </Button>
  );
}

function CharacterGridChoice({
  character,
  selected,
  showDefault,
  onSelect,
}: {
  character: CharacterAssetSelection;
  selected: boolean;
  showDefault: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const avatarSource = character.avatar?.sources['128'] ?? character.avatar?.sources['64'];

  return (
    <Button
      aria-pressed={selected}
      className={cn(
        'relative aspect-[3/4] h-auto w-full overflow-hidden border-border bg-muted p-0 text-left whitespace-normal hover:bg-muted',
        selected && 'border-primary',
      )}
      type="button"
      variant="outline"
      onClick={onSelect}
    >
      {avatarSource ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-200 group-hover/button:scale-[1.02]"
          src={avatarSource}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold text-muted-foreground">
          {character.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 flex min-w-0 flex-col gap-1.5 bg-linear-to-t from-black/85 via-black/55 to-transparent px-3 pt-10 pb-3 text-white">
        <span className="truncate text-sm font-medium">{character.name}</span>
        <span className="flex min-w-0 items-center gap-1 overflow-hidden">
          {showDefault ? <AssetDefaultBadge kind="persona" /> : null}
          {character.visibility ? (
            <Badge className="shrink-0 border-white/35 text-white" variant="outline">
              {t(
                character.visibility === 'public'
                  ? 'characters.list.publicVisibility'
                  : 'characters.list.privateVisibility',
              )}
            </Badge>
          ) : null}
          {character.tags ? (
            <AssetTagList
              className="min-w-0 flex-1 flex-nowrap overflow-hidden [&_[data-slot=badge]]:border-white/35 [&_[data-slot=badge]]:text-white"
              maxItems={1}
              tags={character.tags}
            />
          ) : null}
        </span>
      </span>
    </Button>
  );
}
