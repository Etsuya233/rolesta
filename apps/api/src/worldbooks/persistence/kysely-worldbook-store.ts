import { Injectable } from '@nestjs/common';
import type { Database, WorldbookEntriesTable, WorldbooksTable } from '@rolesta/db';
import { getTotalPages, type PageResponse } from '@rolesta/shared';
import type { Insertable, Selectable, SelectQueryBuilder } from 'kysely';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type {
  ListWorldbooksRequest,
  WorldbookSortKey,
  WorldbookStore,
} from '../ports/worldbook-store.js';
import type { Worldbook, WorldbookEntry, WorldbookSummary } from '../domain/worldbook.js';

@Injectable()
export class KyselyWorldbookStore implements WorldbookStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async list(request: ListWorldbooksRequest): Promise<PageResponse<WorldbookSummary>> {
    const countRow = await withListFilters(this.context.database.selectFrom('worldbooks'), request)
      .select((builder) => builder.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const rows = await withListFilters(this.context.database.selectFrom('worldbooks'), request)
      .select([
        'id',
        'owner_user_id',
        'visibility',
        'name',
        'description',
        'tags_json',
        'created_at_ms',
        'updated_at_ms',
        'last_used_at_ms',
        'usage_count',
      ])
      .orderBy(sortColumns[request.sort], request.direction)
      .orderBy('id', 'asc')
      .limit(request.pageSize)
      .offset(request.pageIndex * request.pageSize)
      .execute();
    const stats = await this.summaryStats(rows.map((row) => row.id));
    const totalItems = Number(countRow.count);

    return {
      items: rows.map((row) => toWorldbookSummary(row, stats.get(row.id))),
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems,
      totalPages: getTotalPages(totalItems, request.pageSize),
    };
  }

  async findVisibleById(id: string, viewerUserId: string): Promise<Worldbook | null> {
    const row = await this.context.database
      .selectFrom('worldbooks')
      .selectAll()
      .where('id', '=', id)
      .where((builder) =>
        builder.or([
          builder('owner_user_id', '=', viewerUserId),
          builder('visibility', '=', 'public'),
        ]),
      )
      .executeTakeFirst();

    return row ? this.aggregate(row) : null;
  }

  async findOwnedById(id: string, ownerUserId: string): Promise<Worldbook | null> {
    const row = await this.context.database
      .selectFrom('worldbooks')
      .selectAll()
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return row ? this.aggregate(row) : null;
  }

  async save(worldbook: Worldbook): Promise<void> {
    const database = this.context.database;
    await database.insertInto('worldbooks').values(toWorldbookRow(worldbook)).execute();

    if (worldbook.entries.length > 0) {
      await database
        .insertInto('worldbook_entries')
        .values(worldbook.entries.map(toEntryRow))
        .execute();
    }
  }

  async update(worldbook: Worldbook): Promise<void> {
    const database = this.context.database;
    await database
      .updateTable('worldbooks')
      .set(toWorldbookRow(worldbook))
      .where('id', '=', worldbook.id)
      .where('owner_user_id', '=', worldbook.ownerUserId)
      .execute();
    await database
      .deleteFrom('worldbook_entries')
      .where('worldbook_id', '=', worldbook.id)
      .execute();

    if (worldbook.entries.length > 0) {
      await database
        .insertInto('worldbook_entries')
        .values(worldbook.entries.map(toEntryRow))
        .execute();
    }
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const result = await this.context.database
      .deleteFrom('worldbooks')
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  private async aggregate(row: WorldbookRow): Promise<Worldbook> {
    const entries = await this.context.database
      .selectFrom('worldbook_entries')
      .selectAll()
      .where('worldbook_id', '=', row.id)
      .orderBy('display_index', 'asc')
      .orderBy('created_at_ms', 'asc')
      .execute();

    return {
      id: row.id,
      ownerUserId: row.owner_user_id,
      visibility: row.visibility,
      name: row.name,
      description: row.description,
      tags: jsonColumn<string[]>(row.tags_json),
      entries: entries.map(toWorldbookEntry),
      sourceFormat: row.source_format,
      sourceSnapshot: jsonColumn<unknown>(row.source_snapshot_json),
      createdAtMs: epochMillisColumn(row.created_at_ms),
      updatedAtMs: epochMillisColumn(row.updated_at_ms),
      lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
      usageCount: row.usage_count,
    };
  }

  private async summaryStats(worldbookIds: string[]): Promise<Map<string, WorldbookSummaryStats>> {
    const stats = new Map<string, WorldbookSummaryStats>(
      worldbookIds.map((id) => [id, { entryCount: 0, enabledEntryCount: 0, tokenCount: 0 }]),
    );

    if (worldbookIds.length === 0) {
      return stats;
    }

    const rows = await this.context.database
      .selectFrom('worldbook_entries')
      .select(['worldbook_id', 'enabled', 'token_count'])
      .where('worldbook_id', 'in', worldbookIds)
      .execute();

    for (const row of rows) {
      const worldbookStats = stats.get(row.worldbook_id);

      if (worldbookStats) {
        worldbookStats.entryCount += 1;
        worldbookStats.tokenCount += row.token_count;

        if (row.enabled === 1) {
          worldbookStats.enabledEntryCount += 1;
        }
      }
    }

    return stats;
  }
}

type WorldbookRow = Selectable<WorldbooksTable>;
type WorldbookListRow = Pick<
  WorldbookRow,
  | 'id'
  | 'owner_user_id'
  | 'visibility'
  | 'name'
  | 'description'
  | 'tags_json'
  | 'created_at_ms'
  | 'updated_at_ms'
  | 'last_used_at_ms'
  | 'usage_count'
>;
type WorldbookInsert = Insertable<WorldbooksTable>;
type WorldbookEntryRow = Selectable<WorldbookEntriesTable>;
type WorldbookEntryInsert = Insertable<WorldbookEntriesTable>;
type WorldbookSelectQuery = SelectQueryBuilder<Database, 'worldbooks', Record<string, never>>;
type WorldbookSummaryStats = Pick<
  WorldbookSummary,
  'entryCount' | 'enabledEntryCount' | 'tokenCount'
>;

const sortColumns = {
  createdAt: 'created_at_ms',
  updatedAt: 'updated_at_ms',
  name: 'name',
  lastUsedAt: 'last_used_at_ms',
  usageCount: 'usage_count',
} satisfies Record<WorldbookSortKey, keyof WorldbooksTable>;

function withListFilters(
  query: WorldbookSelectQuery,
  request: ListWorldbooksRequest,
): WorldbookSelectQuery {
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
    nextQuery = nextQuery.where('name', 'like', `%${request.q.trim()}%`);
  }

  return nextQuery;
}

function toWorldbookRow(worldbook: Worldbook): WorldbookInsert {
  return {
    id: worldbook.id,
    owner_user_id: worldbook.ownerUserId,
    visibility: worldbook.visibility,
    name: worldbook.name,
    description: worldbook.description,
    tags_json: JSON.stringify(worldbook.tags),
    source_format: worldbook.sourceFormat,
    source_snapshot_json: JSON.stringify(worldbook.sourceSnapshot),
    created_at_ms: ensureEpochMillis(worldbook.createdAtMs),
    updated_at_ms: ensureEpochMillis(worldbook.updatedAtMs),
    last_used_at_ms:
      worldbook.lastUsedAtMs === null ? null : ensureEpochMillis(worldbook.lastUsedAtMs),
    usage_count: worldbook.usageCount,
  };
}

function toEntryRow(entry: WorldbookEntry): WorldbookEntryInsert {
  return {
    id: entry.id,
    worldbook_id: entry.worldbookId,
    enabled: entry.enabled ? 1 : 0,
    name: entry.name,
    comment: entry.comment,
    content: entry.content,
    primary_keys_json: JSON.stringify(entry.primaryKeys),
    secondary_keys_json: JSON.stringify(entry.secondaryKeys),
    selective: entry.selective ? 1 : 0,
    selective_logic: entry.selectiveLogic,
    constant: entry.constant ? 1 : 0,
    vectorized: entry.vectorized ? 1 : 0,
    ignore_budget: entry.ignoreBudget ? 1 : 0,
    use_probability: entry.useProbability ? 1 : 0,
    case_sensitive: nullableBooleanColumn(entry.caseSensitive),
    match_whole_words: nullableBooleanColumn(entry.matchWholeWords),
    match_persona_description: entry.matchPersonaDescription ? 1 : 0,
    match_character_description: entry.matchCharacterDescription ? 1 : 0,
    match_character_personality: entry.matchCharacterPersonality ? 1 : 0,
    match_character_depth_prompt: entry.matchCharacterDepthPrompt ? 1 : 0,
    match_scenario: entry.matchScenario ? 1 : 0,
    match_creator_notes: entry.matchCreatorNotes ? 1 : 0,
    insertion_position: entry.insertionPosition,
    insertion_order: entry.insertionOrder,
    display_index: entry.displayIndex,
    depth: entry.depth,
    insertion_role: entry.insertionRole,
    anchor_name: entry.anchorName,
    entry_scan_depth: entry.scanDepth,
    exclude_recursion: entry.excludeRecursion ? 1 : 0,
    prevent_recursion: entry.preventRecursion ? 1 : 0,
    delay_until_recursion: entry.delayUntilRecursion,
    group_name: entry.group,
    group_override: entry.groupOverride ? 1 : 0,
    group_weight: entry.groupWeight,
    use_group_scoring: entry.useGroupScoring === null ? null : entry.useGroupScoring ? 1 : 0,
    sticky: entry.sticky,
    cooldown: entry.cooldown,
    delay: entry.delay,
    character_filter_names_json: JSON.stringify(entry.characterFilterNames),
    character_filter_tags_json: JSON.stringify(entry.characterFilterTags),
    character_filter_exclude: entry.characterFilterExclude ? 1 : 0,
    triggers_json: JSON.stringify(entry.triggers),
    automation_id: entry.automationId,
    add_memo: entry.addMemo ? 1 : 0,
    probability: entry.probability,
    token_count: entry.tokenCount,
    created_at_ms: ensureEpochMillis(entry.createdAtMs),
    updated_at_ms: ensureEpochMillis(entry.updatedAtMs),
  };
}

function toWorldbookSummary(
  row: WorldbookListRow,
  stats: WorldbookSummaryStats | undefined,
): WorldbookSummary {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    visibility: row.visibility,
    name: row.name,
    description: row.description,
    tags: jsonColumn<string[]>(row.tags_json),
    entryCount: stats?.entryCount ?? 0,
    enabledEntryCount: stats?.enabledEntryCount ?? 0,
    tokenCount: stats?.tokenCount ?? 0,
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
    lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
    usageCount: row.usage_count,
  };
}

function toWorldbookEntry(row: WorldbookEntryRow): WorldbookEntry {
  return {
    id: row.id,
    worldbookId: row.worldbook_id,
    enabled: row.enabled === 1,
    name: row.name,
    comment: row.comment,
    content: row.content,
    primaryKeys: jsonColumn<string[]>(row.primary_keys_json),
    secondaryKeys: jsonColumn<string[]>(row.secondary_keys_json),
    selective: row.selective === 1,
    selectiveLogic: row.selective_logic,
    constant: row.constant === 1,
    vectorized: row.vectorized === 1,
    ignoreBudget: row.ignore_budget === 1,
    useProbability: row.use_probability === 1,
    caseSensitive: inheritedBooleanColumn(row.case_sensitive),
    matchWholeWords: inheritedBooleanColumn(row.match_whole_words),
    matchPersonaDescription: row.match_persona_description === 1,
    matchCharacterDescription: row.match_character_description === 1,
    matchCharacterPersonality: row.match_character_personality === 1,
    matchCharacterDepthPrompt: row.match_character_depth_prompt === 1,
    matchScenario: row.match_scenario === 1,
    matchCreatorNotes: row.match_creator_notes === 1,
    insertionPosition: row.insertion_position,
    insertionOrder: row.insertion_order,
    displayIndex: row.display_index,
    depth: row.depth,
    insertionRole: row.insertion_role,
    anchorName: row.anchor_name,
    scanDepth: row.entry_scan_depth,
    excludeRecursion: row.exclude_recursion === 1,
    preventRecursion: row.prevent_recursion === 1,
    delayUntilRecursion: row.delay_until_recursion,
    group: row.group_name,
    groupOverride: row.group_override === 1,
    groupWeight: row.group_weight,
    useGroupScoring: row.use_group_scoring === null ? null : row.use_group_scoring === 1,
    sticky: row.sticky,
    cooldown: row.cooldown,
    delay: row.delay,
    characterFilterNames: jsonColumn<string[]>(row.character_filter_names_json),
    characterFilterTags: jsonColumn<string[]>(row.character_filter_tags_json),
    characterFilterExclude: row.character_filter_exclude === 1,
    triggers: jsonColumn<WorldbookEntry['triggers']>(row.triggers_json),
    automationId: row.automation_id,
    addMemo: row.add_memo === 1,
    probability: row.probability,
    tokenCount: row.token_count,
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
  };
}

function jsonColumn<TValue>(value: string): TValue {
  return JSON.parse(value) as TValue;
}

function nullableBooleanColumn(value: boolean | null): number {
  return value === null ? -1 : value ? 1 : 0;
}

function inheritedBooleanColumn(value: number): boolean | null {
  return value === -1 ? null : value === 1;
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
