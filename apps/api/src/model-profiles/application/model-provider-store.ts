import type { PageResponse } from '@rolesta/shared';
import type {
  ModelProviderApiKey,
  ModelProviderConfig,
  ModelProviderSummary,
} from '../domain/model-provider-config.js';

export const MODEL_PROVIDER_STORE = Symbol('ModelProviderStore');

export const MODEL_PROVIDER_SORT_KEYS = [
  'createdAt',
  'updatedAt',
  'name',
  'lastUsedAt',
  'usageCount',
] as const;
export type ModelProviderSortKey = (typeof MODEL_PROVIDER_SORT_KEYS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface ListModelProvidersRequest {
  viewerUserId: string;
  sort: ModelProviderSortKey;
  direction: SortDirection;
  pageIndex: number;
  pageSize: number;
  q: string;
}

export interface ModelProviderStore {
  list(request: ListModelProvidersRequest): Promise<PageResponse<ModelProviderSummary>>;
  findOwnedById(id: string, ownerUserId: string): Promise<ModelProviderConfig | null>;
  save(config: ModelProviderConfig): Promise<void>;
  update(config: ModelProviderConfig): Promise<void>;
  deleteOwned(id: string, ownerUserId: string): Promise<boolean>;
  addApiKey(apiKey: ModelProviderApiKey): Promise<void>;
  updateApiKey(apiKey: ModelProviderApiKey): Promise<void>;
  deleteApiKey(configId: string, apiKeyId: string): Promise<boolean>;
}
