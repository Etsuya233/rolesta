import type { PageResponse } from '@rolesta/shared';
import type { CharacterCard } from '../domain/character-card.js';

export const CHARACTER_CARD_STORE = Symbol('CharacterCardStore');

export type CharacterListScope = 'all' | 'mine' | 'public';
export type CharacterSortKey = 'createdAt' | 'updatedAt' | 'name' | 'lastUsedAt' | 'usageCount';
export type SortDirection = 'asc' | 'desc';

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
