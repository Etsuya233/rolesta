import { Inject, Injectable } from "@nestjs/common";
import type { AssetDefaultsTable, Database } from "@rolesta/db";
import type { Insertable, Kysely, Selectable, Updateable } from "kysely";
import { KYSELY_DB } from "../../database/database.provider.js";
import type {
  AssetDefaults,
  AssetDefaultsPatch,
} from "../domain/asset-defaults.js";
import { AssetDefaultsPortError } from "../ports/asset-defaults-port-error.js";
import type { AssetDefaultsStore } from "../ports/asset-defaults-store.js";

@Injectable()
export class KyselyAssetDefaultsStore implements AssetDefaultsStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async get(userId: string): Promise<AssetDefaults> {
    const row = await this.db
      .selectFrom("asset_defaults")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirst();

    return row ? toAssetDefaults(row) : { ...emptyAssetDefaults };
  }

  async update(
    userId: string,
    patch: AssetDefaultsPatch,
  ): Promise<AssetDefaults> {
    const updates: Updateable<AssetDefaultsTable> = {};

    if (patch.personaCharacterId !== undefined) {
      updates.persona_character_id = patch.personaCharacterId;
    }
    if (patch.presetId !== undefined) {
      updates.preset_id = patch.presetId;
    }
    if (patch.modelProviderId !== undefined) {
      updates.model_provider_id = patch.modelProviderId;
    }

    const values: Insertable<AssetDefaultsTable> = {
      user_id: userId,
      persona_character_id: patch.personaCharacterId ?? null,
      preset_id: patch.presetId ?? null,
      model_provider_id: patch.modelProviderId ?? null,
    };

    try {
      await this.db
        .insertInto("asset_defaults")
        .values(values)
        .onConflict((conflict) =>
          conflict.column("user_id").doUpdateSet(updates),
        )
        .execute();
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new AssetDefaultsPortError({
          reason: "asset-defaults-conflict",
          cause: error,
        });
      }

      throw error;
    }

    return this.get(userId);
  }
}

const emptyAssetDefaults: AssetDefaults = {
  personaCharacterId: null,
  presetId: null,
  modelProviderId: null,
};

function toAssetDefaults(row: Selectable<AssetDefaultsTable>): AssetDefaults {
  return {
    personaCharacterId: row.persona_character_id,
    presetId: row.preset_id,
    modelProviderId: row.model_provider_id,
  };
}

function isForeignKeyConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_FOREIGNKEY"
  );
}
