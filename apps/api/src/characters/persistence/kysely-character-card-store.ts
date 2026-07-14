import { Injectable } from '@nestjs/common';
import type { CharactersTable, Database } from '@rolesta/db';
import { getTotalPages, type PageResponse } from '@rolesta/shared';
import type { SelectQueryBuilder } from 'kysely';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type {
  CharacterCardStore,
  CharacterSortKey,
  ListCharactersRequest,
} from '../ports/character-card-store.js';
import type { CharacterCard } from '../domain/character-card.js';
import {
  toCharacterCard,
  toCharacterRow,
} from './character-card-row-mapper.js';

@Injectable()
export class KyselyCharacterCardStore implements CharacterCardStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async list(
    request: ListCharactersRequest,
  ): Promise<PageResponse<CharacterCard>> {
    const filteredRows = withListFilters(
      this.context.database.selectFrom('characters'),
      request,
    );
    const countRow = await withListFilters(
      this.context.database.selectFrom('characters'),
      request,
    )
      .select((builder) => builder.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const rows = await filteredRows
      .selectAll()
      .orderBy(sortColumns[request.sort], request.direction)
      .orderBy('id', 'asc')
      .limit(request.pageSize)
      .offset(request.pageIndex * request.pageSize)
      .execute();
    const totalItems = Number(countRow.count);

    return {
      items: rows.map(toCharacterCard),
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems,
      totalPages: getTotalPages(totalItems, request.pageSize),
    };
  }

  async findVisibleById(
    id: string,
    viewerUserId: string,
  ): Promise<CharacterCard | null> {
    const row = await this.context.database
      .selectFrom('characters')
      .selectAll()
      .where('id', '=', id)
      .where((builder) =>
        builder.or([
          builder('owner_user_id', '=', viewerUserId),
          builder('visibility', '=', 'public'),
        ]),
      )
      .executeTakeFirst();

    return row ? toCharacterCard(row) : null;
  }

  async findOwnedById(
    id: string,
    ownerUserId: string,
  ): Promise<CharacterCard | null> {
    const row = await this.context.database
      .selectFrom('characters')
      .selectAll()
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return row ? toCharacterCard(row) : null;
  }

  async save(card: CharacterCard): Promise<void> {
    await this.context.database
      .insertInto('characters')
      .values(toCharacterRow(card))
      .execute();
  }

  async update(card: CharacterCard): Promise<void> {
    await this.context.database
      .updateTable('characters')
      .set(toCharacterRow(card))
      .where('id', '=', card.id)
      .where('owner_user_id', '=', card.ownerUserId)
      .execute();
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const result = await this.context.database
      .deleteFrom('characters')
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}

type CharacterSelectQuery = SelectQueryBuilder<
  Database,
  'characters',
  Record<string, never>
>;

const sortColumns = {
  createdAt: 'created_at_ms',
  updatedAt: 'updated_at_ms',
  name: 'name',
  lastUsedAt: 'last_used_at_ms',
  usageCount: 'usage_count',
} satisfies Record<CharacterSortKey, keyof CharactersTable>;

function withListFilters(
  query: CharacterSelectQuery,
  request: ListCharactersRequest,
): CharacterSelectQuery {
  let nextQuery = query;

  if (request.scope === 'mine') {
    nextQuery = nextQuery.where('owner_user_id', '=', request.viewerUserId);
  }

  if (request.scope === 'public') {
    nextQuery = nextQuery.where('visibility', '=', 'public');
  }

  if (request.scope === 'all') {
    nextQuery = nextQuery.where((builder) =>
      builder.or([
        builder('owner_user_id', '=', request.viewerUserId),
        builder('visibility', '=', 'public'),
      ]),
    );
  }

  if (request.q.trim().length > 0) {
    const keyword = `%${request.q.trim()}%`;
    nextQuery = nextQuery.where((builder) =>
      builder.or([
        builder('name', 'like', keyword),
        builder('comment', 'like', keyword),
        builder('tags_json', 'like', keyword),
      ]),
    );
  }

  return nextQuery;
}
