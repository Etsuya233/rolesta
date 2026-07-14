import { Injectable } from "@nestjs/common";
import type { Database, ModelProviderConfigsTable } from "@rolesta/db";
import { getTotalPages, type PageResponse } from "@rolesta/shared";
import type { Insertable, Selectable, SelectQueryBuilder } from "kysely";
import { KyselyDatabaseContext } from "../../database/kysely-database-context.js";
import { ensureEpochMillis } from "../../shared/epoch-millis.js";
import type {
  ModelProviderConfig,
  ModelProviderSummary,
} from "../domain/model-provider-config.js";
import type {
  ListModelProvidersRequest,
  ModelProviderSortKey,
  ModelProviderStore,
} from "../ports/model-provider-store.js";

@Injectable()
export class KyselyModelProviderStore implements ModelProviderStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async list(
    request: ListModelProvidersRequest,
  ): Promise<PageResponse<ModelProviderSummary>> {
    const countRow = await withListFilters(
      this.context.database.selectFrom("model_provider_configs"),
      request,
    )
      .select((builder) => builder.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();
    const rows = await withListFilters(
      this.context.database.selectFrom("model_provider_configs"),
      request,
    )
      .leftJoin("api_keys", "api_keys.id", "model_provider_configs.api_key_id")
      .select([
        "model_provider_configs.id",
        "model_provider_configs.owner_user_id",
        "model_provider_configs.name",
        "model_provider_configs.provider_kind",
        "model_provider_configs.provider_source",
        "model_provider_configs.base_url",
        "model_provider_configs.default_model_name",
        "model_provider_configs.credential_mode",
        "model_provider_configs.api_key_id",
        "api_keys.name as api_key_name",
        "model_provider_configs.created_at_ms",
        "model_provider_configs.updated_at_ms",
        "model_provider_configs.last_used_at_ms",
        "model_provider_configs.usage_count",
      ])
      .orderBy(
        `model_provider_configs.${sortColumns[request.sort]}`,
        request.direction,
      )
      .orderBy("model_provider_configs.id", "asc")
      .limit(request.pageSize)
      .offset(request.pageIndex * request.pageSize)
      .execute();
    const totalItems = Number(countRow.count);
    return {
      items: rows.map(toSummary),
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems,
      totalPages: getTotalPages(totalItems, request.pageSize),
    };
  }

  async findOwnedById(
    id: string,
    ownerUserId: string,
  ): Promise<ModelProviderConfig | null> {
    const row = await this.context.database
      .selectFrom("model_provider_configs")
      .leftJoin("api_keys", "api_keys.id", "model_provider_configs.api_key_id")
      .selectAll("model_provider_configs")
      .select("api_keys.name as api_key_name")
      .where("model_provider_configs.id", "=", id)
      .where("model_provider_configs.owner_user_id", "=", ownerUserId)
      .executeTakeFirst();
    return row ? { ...toSummary(row), secret: row.secret } : null;
  }

  async save(config: ModelProviderConfig): Promise<void> {
    await this.context.database
      .insertInto("model_provider_configs")
      .values(toRow(config))
      .execute();
  }

  async update(config: ModelProviderConfig): Promise<void> {
    await this.context.database
      .updateTable("model_provider_configs")
      .set(toRow(config))
      .where("id", "=", config.id)
      .where("owner_user_id", "=", config.ownerUserId)
      .execute();
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const result = await this.context.database
      .deleteFrom("model_provider_configs")
      .where("id", "=", id)
      .where("owner_user_id", "=", ownerUserId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}

type ProviderQuery = SelectQueryBuilder<
  Database,
  "model_provider_configs",
  Record<string, never>
>;
type ProviderRow = Selectable<ModelProviderConfigsTable> & {
  api_key_name: string | null;
};

const sortColumns = {
  createdAt: "created_at_ms",
  updatedAt: "updated_at_ms",
  name: "name",
  lastUsedAt: "last_used_at_ms",
  usageCount: "usage_count",
} satisfies Record<ModelProviderSortKey, keyof ModelProviderConfigsTable>;

function withListFilters(
  query: ProviderQuery,
  request: ListModelProvidersRequest,
): ProviderQuery {
  let next = query.where(
    "model_provider_configs.owner_user_id",
    "=",
    request.viewerUserId,
  );
  if (request.q.trim())
    next = next.where(
      "model_provider_configs.name",
      "like",
      `%${request.q.trim()}%`,
    );
  return next;
}

function toRow(
  config: ModelProviderConfig,
): Insertable<ModelProviderConfigsTable> {
  return {
    id: config.id,
    owner_user_id: config.ownerUserId,
    name: config.name,
    provider_kind: config.providerKind,
    provider_source: config.providerSource,
    base_url: config.baseUrl,
    default_model_name: config.defaultModelName,
    credential_mode: config.credentialMode,
    secret: config.secret,
    api_key_id: config.apiKeyId,
    created_at_ms: ensureEpochMillis(config.createdAtMs),
    updated_at_ms: ensureEpochMillis(config.updatedAtMs),
    last_used_at_ms:
      config.lastUsedAtMs === null
        ? null
        : ensureEpochMillis(config.lastUsedAtMs),
    usage_count: config.usageCount,
  };
}

function toSummary(
  row: Omit<ProviderRow, "secret"> | ProviderRow,
): ModelProviderSummary {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    providerKind: row.provider_kind,
    providerSource: row.provider_source,
    baseUrl: row.base_url,
    defaultModelName: row.default_model_name,
    credentialMode: row.credential_mode,
    apiKeyId: row.api_key_id,
    apiKeyName: row.api_key_name,
    createdAtMs: numeric(row.created_at_ms),
    updatedAtMs: numeric(row.updated_at_ms),
    lastUsedAtMs:
      row.last_used_at_ms === null ? null : numeric(row.last_used_at_ms),
    usageCount: row.usage_count,
  };
}

function numeric(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint" || typeof value === "string")
    return Number(value);
  throw new Error("Database number column must be numeric.");
}
