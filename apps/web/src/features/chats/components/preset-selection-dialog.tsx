import { useQuery } from '@tanstack/react-query';
import { CheckIcon } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { AssetPermissionFilterMenu } from '../../assets/components/asset-permission-filter-menu';
import { PageControls } from '../../assets/components/page-controls';
import { AssetSortPopover } from '../../assets/components/asset-sort-popover';
import { AssetDefaultBadge } from '../../chat-preferences/components/asset-default-badge';
import {
  listPresets,
  type PresetListScope,
  type PresetSortKey,
  type SortDirection,
} from '../../presets/api/presets-api';
import { AssetSelectionContentState, AssetSelectionDialog } from './asset-selection-dialog';
import type { PresetAssetSelection } from './chat-asset-selections';

export function PresetSelectionDialog({
  open,
  selectedId,
  value,
  defaultPresetId,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  selectedId: string | null;
  value: PresetAssetSelection | null;
  defaultPresetId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: PresetAssetSelection | null) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [scope, setScope] = useState<PresetListScope>('all');
  const [sort, setSort] = useState<PresetSortKey>('name');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [pending, setPending] = useState<PresetAssetSelection | null>(value);
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
      'presets',
      { q: deferredSearch, scope, sort, direction, pageIndex, pageSize },
    ],
    queryFn: () =>
      listPresets({
        q: deferredSearch,
        scope,
        sort,
        direction,
        pageIndex,
        pageSize,
      }),
  });
  const sortOptions: Array<{ value: PresetSortKey; label: string }> = [
    { value: 'name', label: t('presets.list.sort.name') },
    { value: 'updatedAt', label: t('presets.list.sort.updatedAt') },
    { value: 'createdAt', label: t('presets.list.sort.createdAt') },
    { value: 'lastUsedAt', label: t('presets.list.sort.lastUsedAt') },
    { value: 'usageCount', label: t('presets.list.sort.usageCount') },
  ];

  return (
    <AssetSelectionDialog
      allowClear
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
      title={t('chats.management.picker.presetTitle')}
      toolbar={
        <>
          <AssetPermissionFilterMenu
            buttonLabel={t('presets.list.filterButton')}
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
        <div className="flex flex-col">
          {query.data?.items.map((preset) => (
            <Button
              key={preset.id}
              aria-pressed={preset.id === pendingId}
              className="h-auto w-full justify-start rounded-none border-b px-4 py-3 text-left whitespace-normal"
              type="button"
              variant={preset.id === pendingId ? 'secondary' : 'ghost'}
              onClick={() => {
                setPending(preset);
                setPendingId(preset.id);
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium">{preset.name}</span>
                  {preset.id === defaultPresetId ? <AssetDefaultBadge kind="preset" /> : null}
                  <Badge className="shrink-0" variant="outline">
                    {t(
                      preset.visibility === 'public'
                        ? 'presets.list.publicVisibility'
                        : 'presets.list.privateVisibility',
                    )}
                  </Badge>
                </span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {t('presets.list.tokenCount', {
                      count: preset.tokenCount,
                      value: preset.tokenCount.toLocaleString(),
                    })}
                  </span>
                  <span>
                    {t('presets.list.entryCount', {
                      count: preset.entryCount,
                      value: preset.entryCount.toLocaleString(),
                    })}
                  </span>
                  <span>
                    {t('presets.list.usageCount', {
                      count: preset.usageCount,
                      value: preset.usageCount.toLocaleString(),
                    })}
                  </span>
                </span>
              </span>
              <CheckIcon className={cn('shrink-0', preset.id !== pendingId && 'invisible')} />
            </Button>
          ))}
        </div>
      </AssetSelectionContentState>
    </AssetSelectionDialog>
  );
}
