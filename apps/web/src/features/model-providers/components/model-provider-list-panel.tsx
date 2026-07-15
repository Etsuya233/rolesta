import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/ui/input';
import { AssetSortMenu } from '../../assets/components/asset-sort-menu';
import { PageControls } from '../../assets/components/page-controls';
import {
  listModelProviders,
  type ModelProviderSortKey,
  type SortDirection,
} from '../api/model-providers-api';
import { ModelProviderListItem } from './model-provider-list-item';
import { useAssetDefaults } from '../../chat-preferences/hooks/use-asset-defaults';

export function ModelProviderListPanel({
  onSelectConfig,
}: {
  onSelectConfig: (configId: string) => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<ModelProviderSortKey>('createdAt');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const assetDefaultsQuery = useAssetDefaults();
  const query = useQuery({
    queryKey: ['model-providers', { q, sort, direction, pageIndex, pageSize }],
    queryFn: () => listModelProviders({ q, sort, direction, pageIndex, pageSize }),
  });
  const sortOptions: Array<{ value: ModelProviderSortKey; label: string }> = [
    { value: 'createdAt', label: t('modelProviders.list.sort.createdAt') },
    { value: 'updatedAt', label: t('modelProviders.list.sort.updatedAt') },
    { value: 'name', label: t('modelProviders.list.sort.name') },
    { value: 'lastUsedAt', label: t('modelProviders.list.sort.lastUsedAt') },
    { value: 'usageCount', label: t('modelProviders.list.sort.usageCount') },
  ];

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
        <Input
          aria-label={t('modelProviders.list.searchLabel')}
          placeholder={t('modelProviders.list.searchPlaceholder')}
          value={q}
          onChange={(event) => {
            setPageIndex(0);
            setQ(event.target.value);
          }}
        />
        <AssetSortMenu
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">{t('modelProviders.list.loading')}</p>
        ) : null}
        {query.isError ? (
          <p className="p-4 text-sm text-destructive">{t('modelProviders.list.loadFailed')}</p>
        ) : null}
        {query.data?.items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t('modelProviders.list.empty')}</p>
        ) : null}
        {query.data?.items.map((config) => (
          <ModelProviderListItem
            key={config.id}
            config={config}
            isDefault={
              !assetDefaultsQuery.isError && config.id === assetDefaultsQuery.data?.modelProviderId
            }
            onSelect={onSelectConfig}
          />
        ))}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <PageControls
          pageIndex={query.data?.pageIndex ?? pageIndex}
          pageSize={query.data?.pageSize ?? pageSize}
          totalPages={query.data?.totalPages ?? 1}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(nextPageSize) => {
            setPageIndex(0);
            setPageSize(nextPageSize);
          }}
        />
      </div>
    </div>
  );
}
