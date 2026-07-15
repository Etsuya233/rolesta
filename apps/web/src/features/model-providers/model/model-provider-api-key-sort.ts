import type { ModelProviderApiKeyResponse } from '../api/model-providers-api';

export type ApiKeySortKey = 'updatedAtMs' | 'createdAtMs' | 'name';
export type ApiKeySortDirection = 'asc' | 'desc';

export function sortApiKeys(
  items: ModelProviderApiKeyResponse[],
  sort: ApiKeySortKey,
  direction: ApiKeySortDirection,
  locale: string,
): ModelProviderApiKeyResponse[] {
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...items].sort((left, right) => {
    const comparison =
      sort === 'name' ? left.name.localeCompare(right.name, locale) : left[sort] - right[sort];
    return comparison * multiplier;
  });
}

export function sortApiKeysByName(
  items: ModelProviderApiKeyResponse[],
  locale: string,
): ModelProviderApiKeyResponse[] {
  return sortApiKeys(items, 'name', 'asc', locale);
}
