import { Injectable } from '@nestjs/common';
import type {
  Database,
  PresetEntriesTable,
  PresetPromptItemsTable,
  PresetsTable,
} from '@rolesta/db';
import { getTotalPages, type PageResponse } from '@rolesta/shared';
import type { Insertable, Selectable, SelectQueryBuilder } from 'kysely';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type {
  ListPresetsRequest,
  PresetSortKey,
  PresetStore,
} from '../ports/preset-store.js';
import type { PresetModelSettings } from '../domain/preset-model-settings.js';
import {
  withPresetTokenCount,
  type Preset,
  type PresetEntry,
  type PresetSummary,
} from '../domain/preset.js';

@Injectable()
export class KyselyPresetStore implements PresetStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async list(
    request: ListPresetsRequest,
  ): Promise<PageResponse<PresetSummary>> {
    const filteredRows = withListFilters(
      this.context.database.selectFrom('presets'),
      request,
    );
    const countRow = await withListFilters(
      this.context.database.selectFrom('presets'),
      request,
    )
      .select((builder) => builder.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const rows = await filteredRows
      .select([
        'id',
        'owner_user_id',
        'visibility',
        'name',
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
    const items = rows.map((row) => toPresetSummary(row, stats.get(row.id)));
    const totalItems = Number(countRow.count);

    return {
      items,
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems,
      totalPages: getTotalPages(totalItems, request.pageSize),
    };
  }

  async findOwnedById(id: string, ownerUserId: string): Promise<Preset | null> {
    const row = await this.context.database
      .selectFrom('presets')
      .selectAll()
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return row ? this.aggregate(row) : null;
  }

  async findVisibleById(
    id: string,
    viewerUserId: string,
  ): Promise<Preset | null> {
    const row = await this.context.database
      .selectFrom('presets')
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

  async save(preset: Preset): Promise<void> {
    const database = this.context.database;
    await database.insertInto('presets').values(toPresetRow(preset)).execute();

    if (preset.entries.length > 0) {
      await database
        .insertInto('preset_entries')
        .values(preset.entries.map(toEntryRow))
        .execute();
    }

    if (preset.promptItems.length > 0) {
      await database
        .insertInto('preset_prompt_items')
        .values(
          preset.promptItems.map((item) => toPromptItemRow(preset.id, item)),
        )
        .execute();
    }
  }

  async update(preset: Preset): Promise<void> {
    const database = this.context.database;
    await database
      .updateTable('presets')
      .set(toPresetRow(preset))
      .where('id', '=', preset.id)
      .where('owner_user_id', '=', preset.ownerUserId)
      .execute();
    await database
      .deleteFrom('preset_prompt_items')
      .where('preset_id', '=', preset.id)
      .execute();
    await database
      .deleteFrom('preset_entries')
      .where('preset_id', '=', preset.id)
      .execute();

    if (preset.entries.length > 0) {
      await database
        .insertInto('preset_entries')
        .values(preset.entries.map(toEntryRow))
        .execute();
    }

    if (preset.promptItems.length > 0) {
      await database
        .insertInto('preset_prompt_items')
        .values(
          preset.promptItems.map((item) => toPromptItemRow(preset.id, item)),
        )
        .execute();
    }
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const result = await this.context.database
      .deleteFrom('presets')
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  private async aggregate(row: PresetRow): Promise<Preset> {
    const entryRows = await this.context.database
      .selectFrom('preset_entries')
      .selectAll()
      .where('preset_id', '=', row.id)
      .orderBy('created_at_ms', 'asc')
      .orderBy('id', 'asc')
      .execute();
    const itemRows = await this.context.database
      .selectFrom('preset_prompt_items')
      .selectAll()
      .where('preset_id', '=', row.id)
      .orderBy('order_index', 'asc')
      .execute();

    return withPresetTokenCount({
      id: row.id,
      ownerUserId: row.owner_user_id,
      visibility: row.visibility,
      name: row.name,
      modelProviderId: row.model_provider_id,
      modelSettings: jsonColumn<PresetModelSettings>(row.model_settings_json),
      tokenizer: row.tokenizer,
      entries: entryRows.map(toPresetEntry),
      promptItems: itemRows.map(toPromptItem),
      sourceFormat: row.source_format,
      sourceSnapshot: jsonColumn<unknown>(row.source_snapshot_json),
      createdAtMs: epochMillisColumn(row.created_at_ms),
      updatedAtMs: epochMillisColumn(row.updated_at_ms),
      lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
      usageCount: row.usage_count,
    });
  }

  private async summaryStats(
    presetIds: string[],
  ): Promise<Map<string, PresetSummaryStats>> {
    const stats = new Map<string, PresetSummaryStats>(
      presetIds.map((id) => [
        id,
        { entryCount: 0, promptItemCount: 0, tokenCount: 0 },
      ]),
    );

    if (presetIds.length === 0) {
      return stats;
    }

    const entryRows = await this.context.database
      .selectFrom('preset_entries')
      .select(['id', 'preset_id', 'token_count'])
      .where('preset_id', 'in', presetIds)
      .execute();
    const tokenCountByEntryId = new Map<string, number>();

    for (const row of entryRows) {
      tokenCountByEntryId.set(row.id, row.token_count);
      const presetStats = stats.get(row.preset_id);

      if (presetStats) {
        presetStats.entryCount += 1;
      }
    }

    const itemRows = await this.context.database
      .selectFrom('preset_prompt_items')
      .select(['preset_id', 'entry_id', 'enabled'])
      .where('preset_id', 'in', presetIds)
      .execute();

    for (const row of itemRows) {
      const presetStats = stats.get(row.preset_id);

      if (presetStats) {
        presetStats.promptItemCount += 1;

        if (row.enabled === 1) {
          presetStats.tokenCount += tokenCountByEntryId.get(row.entry_id) ?? 0;
        }
      }
    }

    return stats;
  }
}

type PresetRow = Selectable<PresetsTable>;
type PresetListRow = Pick<
  PresetRow,
  | 'id'
  | 'owner_user_id'
  | 'visibility'
  | 'name'
  | 'created_at_ms'
  | 'updated_at_ms'
  | 'last_used_at_ms'
  | 'usage_count'
>;
type PresetInsert = Insertable<PresetsTable>;
type PresetEntryRow = Selectable<PresetEntriesTable>;
type PresetEntryInsert = Insertable<PresetEntriesTable>;
type PresetPromptItemRow = Selectable<PresetPromptItemsTable>;
type PresetPromptItemInsert = Insertable<PresetPromptItemsTable>;
type PresetSelectQuery = SelectQueryBuilder<
  Database,
  'presets',
  Record<string, never>
>;
type PresetSummaryStats = Pick<
  PresetSummary,
  'entryCount' | 'promptItemCount' | 'tokenCount'
>;

const sortColumns = {
  createdAt: 'created_at_ms',
  updatedAt: 'updated_at_ms',
  name: 'name',
  lastUsedAt: 'last_used_at_ms',
  usageCount: 'usage_count',
} satisfies Record<PresetSortKey, keyof PresetsTable>;

function withListFilters(
  query: PresetSelectQuery,
  request: ListPresetsRequest,
): PresetSelectQuery {
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

function toPresetRow(preset: Preset): PresetInsert {
  return {
    id: preset.id,
    owner_user_id: preset.ownerUserId,
    visibility: preset.visibility,
    name: preset.name,
    model_provider_id: preset.modelProviderId,
    model_settings_json: JSON.stringify(preset.modelSettings),
    tokenizer: preset.tokenizer,
    source_format: preset.sourceFormat,
    source_snapshot_json: JSON.stringify(preset.sourceSnapshot),
    created_at_ms: ensureEpochMillis(preset.createdAtMs),
    updated_at_ms: ensureEpochMillis(preset.updatedAtMs),
    last_used_at_ms:
      preset.lastUsedAtMs === null
        ? null
        : ensureEpochMillis(preset.lastUsedAtMs),
    usage_count: preset.usageCount,
  };
}

function toPresetSummary(
  row: PresetListRow,
  stats: PresetSummaryStats | undefined,
): PresetSummary {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    visibility: row.visibility,
    name: row.name,
    entryCount: stats?.entryCount ?? 0,
    promptItemCount: stats?.promptItemCount ?? 0,
    tokenCount: stats?.tokenCount ?? 0,
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
    lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
    usageCount: row.usage_count,
  };
}

function toEntryRow(entry: PresetEntry): PresetEntryInsert {
  return {
    id: entry.id,
    preset_id: entry.presetId,
    identifier: entry.identifier,
    name: entry.name,
    role: entry.role,
    position: entry.position,
    content: entry.content,
    token_count: entry.tokenCount,
    metadata_json: JSON.stringify(entry.metadata),
    created_at_ms: ensureEpochMillis(entry.createdAtMs),
    updated_at_ms: ensureEpochMillis(entry.updatedAtMs),
  };
}

function toPromptItemRow(
  presetId: string,
  item: Preset['promptItems'][number],
): PresetPromptItemInsert {
  return {
    preset_id: presetId,
    entry_id: item.entryId,
    enabled: item.enabled ? 1 : 0,
    order_index: item.orderIndex,
  };
}

function toPresetEntry(row: PresetEntryRow): PresetEntry {
  return {
    id: row.id,
    presetId: row.preset_id,
    identifier: row.identifier,
    name: row.name,
    role: row.role,
    position: row.position,
    content: row.content,
    tokenCount: row.token_count,
    metadata: jsonColumn<Record<string, unknown>>(row.metadata_json),
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
  };
}

function toPromptItem(row: PresetPromptItemRow): Preset['promptItems'][number] {
  return {
    entryId: row.entry_id,
    enabled: row.enabled === 1,
    orderIndex: row.order_index,
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

  throw new Error(
    'Database number column must be a number, bigint, or string.',
  );
}
