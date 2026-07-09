import { clampPageIndex, clampPageSize, type PageResponse } from '@rolesta/shared';
import type {
  CharacterCardStore,
  CharacterListScope,
  CharacterSortKey,
  SortDirection,
} from '../ports/character-card-store.js';
import type { CharacterCard } from '../domain/character-card.js';

export interface ListCharactersCommand {
  viewerUserId: string;
  scope?: CharacterListScope;
  sort?: CharacterSortKey;
  direction?: SortDirection;
  pageIndex?: number;
  pageSize?: number;
  q?: string;
}

export class ListCharactersUseCase {
  constructor(private readonly store: CharacterCardStore) {}

  execute(command: ListCharactersCommand): Promise<PageResponse<CharacterCard>> {
    return this.store.list({
      viewerUserId: command.viewerUserId,
      scope: command.scope ?? 'all',
      sort: command.sort ?? 'createdAt',
      direction: command.direction ?? 'desc',
      pageIndex: clampPageIndex(command.pageIndex ?? 0),
      pageSize: clampPageSize(command.pageSize ?? 20),
      q: command.q ?? '',
    });
  }
}
