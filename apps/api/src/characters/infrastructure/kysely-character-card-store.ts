import { Inject, Injectable } from '@nestjs/common';
import type { CharactersTable, Database } from '@rolesta/db';
import { getTotalPages, type PageResponse } from '@rolesta/shared';
import type { Insertable, Kysely, Selectable, SelectQueryBuilder } from 'kysely';
import { KYSELY_DB } from '../../database/database.provider.js';
import type {
  CharacterCardStore,
  CharacterSortKey,
  ListCharactersRequest,
} from '../application/character-card-store.js';
import type { CharacterCard } from '../domain/character-card.js';
import { ensureEpochMillis } from '../domain/epoch-millis.js';

@Injectable()
export class KyselyCharacterCardStore implements CharacterCardStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async list(request: ListCharactersRequest): Promise<PageResponse<CharacterCard>> {
    const filteredRows = withListFilters(this.db.selectFrom('characters'), request);
    const countRow = await withListFilters(this.db.selectFrom('characters'), request)
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

  async findVisibleById(id: string, viewerUserId: string): Promise<CharacterCard | null> {
    const row = await this.db
      .selectFrom('characters')
      .selectAll()
      .where('id', '=', id)
      .where((builder) =>
        builder.or([builder('owner_user_id', '=', viewerUserId), builder('visibility', '=', 'public')]),
      )
      .executeTakeFirst();

    return row ? toCharacterCard(row) : null;
  }

  async findOwnedById(id: string, ownerUserId: string): Promise<CharacterCard | null> {
    const row = await this.db
      .selectFrom('characters')
      .selectAll()
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return row ? toCharacterCard(row) : null;
  }

  async save(card: CharacterCard): Promise<void> {
    await this.db.insertInto('characters').values(toCharacterRow(card)).execute();
  }

  async update(card: CharacterCard): Promise<void> {
    await this.db
      .updateTable('characters')
      .set(toCharacterRow(card))
      .where('id', '=', card.id)
      .where('owner_user_id', '=', card.ownerUserId)
      .execute();
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('characters')
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}

type CharacterRow = Selectable<CharactersTable>;
type CharacterInsert = Insertable<CharactersTable>;
type CharacterSelectQuery = SelectQueryBuilder<Database, 'characters', Record<string, never>>;

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

function toCharacterCard(row: CharacterRow): CharacterCard {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    visibility: row.visibility,
    name: row.name,
    nickname: row.nickname,
    comment: row.comment,
    tags: jsonColumn<string[]>(row.tags_json),
    version: row.version,
    creator: row.creator,
    description: row.description,
    personality: row.personality,
    scenario: row.scenario,
    firstMessage: row.first_message,
    alternateGreetings: jsonColumn<string[]>(row.alternate_greetings_json),
    groupOnlyGreetings: jsonColumn<string[]>(row.group_only_greetings_json),
    messageExample: row.message_example,
    creatorNotes: row.creator_notes,
    creatorNotesMultilingual: jsonColumn<Record<string, string>>(row.creator_notes_multilingual_json),
    systemPrompt: row.system_prompt,
    postHistoryInstructions: row.post_history_instructions,
    characterBook:
      row.character_book_json === null
        ? null
        : jsonColumn<Record<string, unknown>>(row.character_book_json),
    assets: jsonColumn<unknown[]>(row.assets_json),
    source: jsonColumn<string[]>(row.source_json),
    metadata: jsonColumn<Record<string, unknown>>(row.metadata_json),
    sourceFormat: row.source_format,
    sourceSnapshot: jsonColumn<unknown>(row.source_snapshot_json),
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
    creationDateMs: nullableEpochMillisColumn(row.creation_date_ms),
    modificationDateMs: nullableEpochMillisColumn(row.modification_date_ms),
    lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
    usageCount: row.usage_count,
  };
}

function toCharacterRow(card: CharacterCard): CharacterInsert {
  return {
    id: card.id,
    owner_user_id: card.ownerUserId,
    visibility: card.visibility,
    name: card.name,
    nickname: card.nickname,
    comment: card.comment,
    tags_json: JSON.stringify(card.tags),
    version: card.version,
    creator: card.creator,
    description: card.description,
    personality: card.personality,
    scenario: card.scenario,
    first_message: card.firstMessage,
    alternate_greetings_json: JSON.stringify(card.alternateGreetings),
    group_only_greetings_json: JSON.stringify(card.groupOnlyGreetings),
    message_example: card.messageExample,
    creator_notes: card.creatorNotes,
    creator_notes_multilingual_json: JSON.stringify(card.creatorNotesMultilingual),
    system_prompt: card.systemPrompt,
    post_history_instructions: card.postHistoryInstructions,
    character_book_json: card.characterBook === null ? null : JSON.stringify(card.characterBook),
    assets_json: JSON.stringify(card.assets),
    source_json: JSON.stringify(card.source),
    metadata_json: JSON.stringify(card.metadata),
    source_format: card.sourceFormat,
    source_snapshot_json: JSON.stringify(card.sourceSnapshot),
    created_at_ms: ensureEpochMillis(card.createdAtMs),
    updated_at_ms: ensureEpochMillis(card.updatedAtMs),
    creation_date_ms: card.creationDateMs === null ? null : ensureEpochMillis(card.creationDateMs),
    modification_date_ms: card.modificationDateMs === null ? null : ensureEpochMillis(card.modificationDateMs),
    last_used_at_ms: card.lastUsedAtMs === null ? null : ensureEpochMillis(card.lastUsedAtMs),
    usage_count: card.usageCount,
  };
}

function jsonColumn<TValue>(value: string): TValue {
  return JSON.parse(value) as TValue;
}

function epochMillisColumn(value: unknown): number {
  return ensureEpochMillis(numberColumn(value));
}

function nullableEpochMillisColumn(value: unknown): number | null {
  return value === null ? null : ensureEpochMillis(numberColumn(value));
}

function numberColumn(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  throw new Error('Database number column must be a number, bigint, or string.');
}
