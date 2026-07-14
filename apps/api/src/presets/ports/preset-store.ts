import type { PageResponse } from '@rolesta/shared';
import type { Preset, PresetSummary } from '../domain/preset.js';

export const PRESET_STORE = Symbol('PresetStore');

export const PRESET_SORT_KEYS = [
  'createdAt',
  'updatedAt',
  'name',
  'lastUsedAt',
  'usageCount',
] as const;
export type PresetSortKey = (typeof PRESET_SORT_KEYS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const PRESET_LIST_SCOPES = ['all', 'mine', 'public'] as const;
export type PresetListScope = (typeof PRESET_LIST_SCOPES)[number];

export interface ListPresetsRequest {
  viewerUserId: string;
  scope: PresetListScope;
  sort: PresetSortKey;
  direction: SortDirection;
  pageIndex: number;
  pageSize: number;
  q: string;
}

export interface PresetStore {
  list(request: ListPresetsRequest): Promise<PageResponse<PresetSummary>>;
  findVisibleById(id: string, viewerUserId: string): Promise<Preset | null>;
  findOwnedById(id: string, ownerUserId: string): Promise<Preset | null>;
  save(preset: Preset): Promise<void>;
  update(preset: Preset): Promise<void>;
  updateModelProviderAssociation(
    presetId: string,
    ownerUserId: string,
    modelProviderId: string | null,
  ): Promise<void>;
  deleteOwned(id: string, ownerUserId: string): Promise<boolean>;
}
