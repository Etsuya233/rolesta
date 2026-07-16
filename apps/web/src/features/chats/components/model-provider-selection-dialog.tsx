import { useQuery } from '@tanstack/react-query';
import { CheckIcon } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { PageControls } from '../../assets/components/page-controls';
import { AssetSortPopover } from '../../assets/components/asset-sort-popover';
import { AssetDefaultBadge } from '../../chat-preferences/components/asset-default-badge';
import {
  listModelProviders,
  type ModelProviderSortKey,
  type SortDirection,
} from '../../model-providers/api/model-providers-api';
import { AssetSelectionContentState, AssetSelectionDialog } from './asset-selection-dialog';
import type { ModelProviderAssetSelection } from './chat-asset-selections';
import { formatModelProviderKind } from './model-provider-kind-label';

export function ModelProviderSelectionDialog({
  open,
  selectedId,
  value,
  defaultModelProviderId,
  pinnedModelProviderId,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  selectedId: string | null;
  value: ModelProviderAssetSelection | null;
  defaultModelProviderId: string | null;
  pinnedModelProviderId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: ModelProviderAssetSelection | null) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<ModelProviderSortKey>('name');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [pending, setPending] = useState<ModelProviderAssetSelection | null>(value);
  const [pendingId, setPendingId] = useState<string | null>(selectedId);

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
      'model-providers',
      { q: deferredSearch, sort, direction, pageIndex, pageSize },
    ],
    queryFn: () =>
      listModelProviders({
        q: deferredSearch,
        sort,
        direction,
        pageIndex,
        pageSize,
      }),
  });
  const items = [...(query.data?.items ?? [])].sort(
    (left, right) =>
      Number(right.id === pinnedModelProviderId) - Number(left.id === pinnedModelProviderId),
  );
  const sortOptions: Array<{ value: ModelProviderSortKey; label: string }> = [
    { value: 'name', label: t('modelProviders.list.sort.name') },
    { value: 'updatedAt', label: t('modelProviders.list.sort.updatedAt') },
    { value: 'createdAt', label: t('modelProviders.list.sort.createdAt') },
    { value: 'lastUsedAt', label: t('modelProviders.list.sort.lastUsedAt') },
    { value: 'usageCount', label: t('modelProviders.list.sort.usageCount') },
  ];

  return (
    <AssetSelectionDialog
      allowClear
      description={t('chats.management.picker.modelProviderDescription')}
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
      title={t('chats.management.picker.modelProviderTitle')}
      toolbar={
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
        empty={items?.length === 0}
        error={query.isError}
        loading={query.isLoading}
        onRetry={() => void query.refetch()}
      >
        <div className="flex flex-col">
          {items?.map((config) => (
            <Button
              key={config.id}
              aria-pressed={config.id === pendingId}
              className="h-auto w-full justify-start rounded-none border-b px-4 py-3 text-left whitespace-normal"
              type="button"
              variant={config.id === pendingId ? 'secondary' : 'ghost'}
              onClick={() => {
                setPending(config);
                setPendingId(config.id);
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">{config.name}</span>
                  {config.id === defaultModelProviderId ? (
                    <AssetDefaultBadge kind="modelProvider" />
                  ) : null}
                  {config.id === pinnedModelProviderId ? (
                    <span className="text-xs text-muted-foreground">
                      {t('chats.management.form.presetModel')}
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatModelProviderKind(config.providerKind)}</span>
                  <span>{config.defaultModelName || t('modelProviders.list.noDefaultModel')}</span>
                </span>
              </span>
              <CheckIcon className={cn('shrink-0', config.id !== pendingId && 'invisible')} />
            </Button>
          ))}
        </div>
      </AssetSelectionContentState>
    </AssetSelectionDialog>
  );
}
