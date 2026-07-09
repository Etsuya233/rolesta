import { Inject, Injectable } from '@nestjs/common';
import type {
  Database,
  ModelProviderApiKeysTable,
  ModelProviderConfigsTable,
} from '@rolesta/db';
import { getTotalPages, type PageResponse } from '@rolesta/shared';
import type { Insertable, Kysely, Selectable, SelectQueryBuilder } from 'kysely';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import { KYSELY_DB } from '../../database/database.provider.js';
import type {
  ListModelProvidersRequest,
  ModelProviderSortKey,
  ModelProviderStore,
} from '../application/model-provider-store.js';
import type {
  ModelProviderApiKey,
  ModelProviderConfig,
  ModelProviderSummary,
} from '../domain/model-provider-config.js';

@Injectable()
export class KyselyModelProviderStore implements ModelProviderStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async list(
    request: ListModelProvidersRequest,
  ): Promise<PageResponse<ModelProviderSummary>> {
    const filteredRows = withListFilters(this.db.selectFrom('model_provider_configs'), request);
    const countRow = await withListFilters(this.db.selectFrom('model_provider_configs'), request)
      .select((builder) => builder.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    const rows = await filteredRows
      .select([
        'id',
        'owner_user_id',
        'name',
        'provider_kind',
        'provider_source',
        'base_url',
        'default_model_name',
        'selected_api_key_id',
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
    const apiKeyCounts = await this.apiKeyCounts(rows.map((row) => row.id));
    const totalItems = Number(countRow.count);

    return {
      items: rows.map((row) => toModelProviderSummary(row, apiKeyCounts.get(row.id) ?? 0)),
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems,
      totalPages: getTotalPages(totalItems, request.pageSize),
    };
  }

  async findOwnedById(id: string, ownerUserId: string): Promise<ModelProviderConfig | null> {
    const row = await this.db
      .selectFrom('model_provider_configs')
      .selectAll()
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    if (row === undefined) {
      return null;
    }

    const apiKeyRows = await this.db
      .selectFrom('model_provider_api_keys')
      .selectAll()
      .where('config_id', '=', row.id)
      .orderBy('created_at_ms', 'asc')
      .orderBy('id', 'asc')
      .execute();

    return toModelProviderConfig(row, apiKeyRows);
  }

  async save(config: ModelProviderConfig): Promise<void> {
    await this.db.insertInto('model_provider_configs').values(toConfigRow(config)).execute();
  }

  async update(config: ModelProviderConfig): Promise<void> {
    await this.db
      .updateTable('model_provider_configs')
      .set(toConfigRow(config))
      .where('id', '=', config.id)
      .where('owner_user_id', '=', config.ownerUserId)
      .execute();
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('model_provider_configs')
      .where('id', '=', id)
      .where('owner_user_id', '=', ownerUserId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  async addApiKey(apiKey: ModelProviderApiKey): Promise<void> {
    await this.db.insertInto('model_provider_api_keys').values(toApiKeyRow(apiKey)).execute();
  }

  async updateApiKey(apiKey: ModelProviderApiKey): Promise<void> {
    await this.db
      .updateTable('model_provider_api_keys')
      .set(toApiKeyRow(apiKey))
      .where('id', '=', apiKey.id)
      .where('config_id', '=', apiKey.configId)
      .execute();
  }

  async deleteApiKeyAndTouchConfig(
    configId: string,
    apiKeyId: string,
    updatedAtMs: number,
  ): Promise<boolean> {
    return this.db.transaction().execute(async (trx) => {
      const result = await trx
        .deleteFrom('model_provider_api_keys')
        .where('id', '=', apiKeyId)
        .where('config_id', '=', configId)
        .executeTakeFirst();

      if (Number(result.numDeletedRows) === 0) {
        return false;
      }

      await trx
        .updateTable('model_provider_configs')
        .set({ selected_api_key_id: null, updated_at_ms: ensureEpochMillis(updatedAtMs) })
        .where('id', '=', configId)
        .where('selected_api_key_id', '=', apiKeyId)
        .execute();
      await trx
        .updateTable('model_provider_configs')
        .set({ updated_at_ms: ensureEpochMillis(updatedAtMs) })
        .where('id', '=', configId)
        .execute();

      return true;
    });
  }

  private async apiKeyCounts(configIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>(configIds.map((id) => [id, 0]));

    if (configIds.length === 0) {
      return counts;
    }

    const rows = await this.db
      .selectFrom('model_provider_api_keys')
      .select(['config_id'])
      .where('config_id', 'in', configIds)
      .execute();

    for (const row of rows) {
      counts.set(row.config_id, (counts.get(row.config_id) ?? 0) + 1);
    }

    return counts;
  }
}

type ModelProviderConfigRow = Selectable<ModelProviderConfigsTable>;
type ModelProviderConfigListRow = Pick<
  ModelProviderConfigRow,
  | 'id'
  | 'owner_user_id'
  | 'name'
  | 'provider_kind'
  | 'provider_source'
  | 'base_url'
  | 'default_model_name'
  | 'selected_api_key_id'
  | 'created_at_ms'
  | 'updated_at_ms'
  | 'last_used_at_ms'
  | 'usage_count'
>;
type ModelProviderConfigInsert = Insertable<ModelProviderConfigsTable>;
type ModelProviderApiKeyRow = Selectable<ModelProviderApiKeysTable>;
type ModelProviderApiKeyInsert = Insertable<ModelProviderApiKeysTable>;
type ModelProviderSelectQuery = SelectQueryBuilder<
  Database,
  'model_provider_configs',
  Record<string, never>
>;

const sortColumns = {
  createdAt: 'created_at_ms',
  updatedAt: 'updated_at_ms',
  name: 'name',
  lastUsedAt: 'last_used_at_ms',
  usageCount: 'usage_count',
} satisfies Record<ModelProviderSortKey, keyof ModelProviderConfigsTable>;

function withListFilters(
  query: ModelProviderSelectQuery,
  request: ListModelProvidersRequest,
): ModelProviderSelectQuery {
  let nextQuery = query.where('owner_user_id', '=', request.viewerUserId);

  if (request.q.trim().length > 0) {
    nextQuery = nextQuery.where('name', 'like', `%${request.q.trim()}%`);
  }

  return nextQuery;
}

function toConfigRow(config: ModelProviderConfig): ModelProviderConfigInsert {
  return {
    id: config.id,
    owner_user_id: config.ownerUserId,
    name: config.name,
    provider_kind: config.providerKind,
    provider_source: config.providerSource,
    base_url: config.baseUrl,
    default_model_name: config.defaultModelName,
    selected_api_key_id: config.selectedApiKeyId,
    created_at_ms: ensureEpochMillis(config.createdAtMs),
    updated_at_ms: ensureEpochMillis(config.updatedAtMs),
    last_used_at_ms: config.lastUsedAtMs === null ? null : ensureEpochMillis(config.lastUsedAtMs),
    usage_count: config.usageCount,
  };
}

function toApiKeyRow(apiKey: ModelProviderApiKey): ModelProviderApiKeyInsert {
  return {
    id: apiKey.id,
    config_id: apiKey.configId,
    name: apiKey.name,
    secret: apiKey.secret,
    created_at_ms: ensureEpochMillis(apiKey.createdAtMs),
    updated_at_ms: ensureEpochMillis(apiKey.updatedAtMs),
  };
}

function toModelProviderSummary(
  row: ModelProviderConfigListRow,
  apiKeyCount: number,
): ModelProviderSummary {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    providerKind: row.provider_kind,
    providerSource: row.provider_source,
    baseUrl: row.base_url,
    defaultModelName: row.default_model_name,
    selectedApiKeyId: row.selected_api_key_id,
    apiKeyCount,
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
    lastUsedAtMs: nullableEpochMillisColumn(row.last_used_at_ms),
    usageCount: row.usage_count,
  };
}

function toModelProviderConfig(
  row: ModelProviderConfigRow,
  apiKeyRows: ModelProviderApiKeyRow[],
): ModelProviderConfig {
  return {
    ...toModelProviderSummary(row, apiKeyRows.length),
    apiKeys: apiKeyRows.map(toModelProviderApiKey),
  };
}

function toModelProviderApiKey(row: ModelProviderApiKeyRow): ModelProviderApiKey {
  return {
    id: row.id,
    configId: row.config_id,
    name: row.name,
    secret: row.secret,
    createdAtMs: epochMillisColumn(row.created_at_ms),
    updatedAtMs: epochMillisColumn(row.updated_at_ms),
  };
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
