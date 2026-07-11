import { Inject, Injectable } from "@nestjs/common";
import type { ApiKeysTable, Database } from "@rolesta/db";
import type { Insertable, Kysely, Selectable } from "kysely";
import { KYSELY_DB } from "../../database/database.provider.js";
import { ensureEpochMillis } from "../../shared/epoch-millis.js";
import type { ApiKey } from "../domain/model-provider-config.js";
import type { ApiKeyStore } from "../ports/api-key-store.js";

@Injectable()
export class KyselyApiKeyStore implements ApiKeyStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async listOwned(ownerUserId: string): Promise<ApiKey[]> {
    const rows = await this.db
      .selectFrom("api_keys")
      .selectAll()
      .where("owner_user_id", "=", ownerUserId)
      .orderBy("name", "asc")
      .orderBy("id", "asc")
      .execute();
    return rows.map(toApiKey);
  }

  async findOwnedById(id: string, ownerUserId: string): Promise<ApiKey | null> {
    const row = await this.db
      .selectFrom("api_keys")
      .selectAll()
      .where("id", "=", id)
      .where("owner_user_id", "=", ownerUserId)
      .executeTakeFirst();
    return row ? toApiKey(row) : null;
  }

  async save(apiKey: ApiKey): Promise<void> {
    await this.db.insertInto("api_keys").values(toRow(apiKey)).execute();
  }
  async update(apiKey: ApiKey): Promise<void> {
    await this.db
      .updateTable("api_keys")
      .set(toRow(apiKey))
      .where("id", "=", apiKey.id)
      .where("owner_user_id", "=", apiKey.ownerUserId)
      .execute();
  }

  async countProviderReferences(
    id: string,
    ownerUserId: string,
  ): Promise<number> {
    const row = await this.db
      .selectFrom("model_provider_configs")
      .select((builder) => builder.fn.countAll<number>().as("count"))
      .where("owner_user_id", "=", ownerUserId)
      .where("api_key_id", "=", id)
      .executeTakeFirstOrThrow();
    return Number(row.count);
  }

  async deleteOwnedAndClearProviderReferences(
    id: string,
    ownerUserId: string,
    updatedAtMs: number,
  ): Promise<number | null> {
    return this.db.transaction().execute(async (trx) => {
      const key = await trx
        .selectFrom("api_keys")
        .select("id")
        .where("id", "=", id)
        .where("owner_user_id", "=", ownerUserId)
        .executeTakeFirst();
      if (!key) return null;
      const result = await trx
        .updateTable("model_provider_configs")
        .set({
          credential_mode: "manual",
          secret: "",
          api_key_id: null,
          updated_at_ms: ensureEpochMillis(updatedAtMs),
        })
        .where("owner_user_id", "=", ownerUserId)
        .where("api_key_id", "=", id)
        .executeTakeFirst();
      await trx
        .deleteFrom("api_keys")
        .where("id", "=", id)
        .where("owner_user_id", "=", ownerUserId)
        .execute();
      return Number(result.numUpdatedRows);
    });
  }
}

function toRow(apiKey: ApiKey): Insertable<ApiKeysTable> {
  return {
    id: apiKey.id,
    owner_user_id: apiKey.ownerUserId,
    name: apiKey.name,
    secret: apiKey.secret,
    created_at_ms: ensureEpochMillis(apiKey.createdAtMs),
    updated_at_ms: ensureEpochMillis(apiKey.updatedAtMs),
  };
}

function toApiKey(row: Selectable<ApiKeysTable>): ApiKey {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    secret: row.secret,
    createdAtMs: Number(row.created_at_ms),
    updatedAtMs: Number(row.updated_at_ms),
  };
}
