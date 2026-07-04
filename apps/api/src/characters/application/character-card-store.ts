import type { PageResponse } from '@rolesta/shared';
import type { CharacterCard } from '../domain/character-card.js';

export const CHARACTER_CARD_STORE = Symbol('CharacterCardStore');

export const CHARACTER_LIST_SCOPES = ['all', 'mine', 'public'] as const;
export type CharacterListScope = (typeof CHARACTER_LIST_SCOPES)[number];

export const CHARACTER_SORT_KEYS = [
  'createdAt',
  'updatedAt',
  'name',
  'lastUsedAt',
  'usageCount',
] as const;
export type CharacterSortKey = (typeof CHARACTER_SORT_KEYS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface ListCharactersRequest {
  viewerUserId: string;
  scope: CharacterListScope;
  sort: CharacterSortKey;
  direction: SortDirection;
  pageIndex: number;
  pageSize: number;
  q: string;
}

export interface CharacterCardStore {
  list(request: ListCharactersRequest): Promise<PageResponse<CharacterCard>>;
  findVisibleById(id: string, viewerUserId: string): Promise<CharacterCard | null>;
  findOwnedById(id: string, ownerUserId: string): Promise<CharacterCard | null>;
  save(card: CharacterCard): Promise<void>;
  update(card: CharacterCard): Promise<void>;
  deleteOwned(id: string, ownerUserId: string): Promise<boolean>;
}
