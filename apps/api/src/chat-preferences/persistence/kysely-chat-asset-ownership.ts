import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@rolesta/db";
import type { Kysely } from "kysely";
import { KYSELY_DB } from "../../database/database.provider.js";
import type {
  AssetDefaultField,
  AssetDefaultsPatch,
} from "../domain/asset-defaults.js";
import type { ChatAssetOwnership } from "../ports/chat-asset-ownership.js";

@Injectable()
export class KyselyChatAssetOwnership implements ChatAssetOwnership {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async findUnavailableFields(
    userId: string,
    patch: AssetDefaultsPatch,
  ): Promise<AssetDefaultField[]> {
    const checks: Array<Promise<AssetDefaultField | null>> = [];

    if (
      patch.personaCharacterId !== undefined &&
      patch.personaCharacterId !== null
    ) {
      checks.push(
        this.db
          .selectFrom("characters")
          .select("id")
          .where("id", "=", patch.personaCharacterId)
          .where("owner_user_id", "=", userId)
          .executeTakeFirst()
          .then((row) => (row ? null : "personaCharacterId")),
      );
    }

    if (patch.presetId !== undefined && patch.presetId !== null) {
      checks.push(
        this.db
          .selectFrom("presets")
          .select("id")
          .where("id", "=", patch.presetId)
          .where("owner_user_id", "=", userId)
          .executeTakeFirst()
          .then((row) => (row ? null : "presetId")),
      );
    }

    if (patch.modelProviderId !== undefined && patch.modelProviderId !== null) {
      checks.push(
        this.db
          .selectFrom("model_provider_configs")
          .select("id")
          .where("id", "=", patch.modelProviderId)
          .where("owner_user_id", "=", userId)
          .executeTakeFirst()
          .then((row) => (row ? null : "modelProviderId")),
      );
    }

    return (await Promise.all(checks)).filter(
      (field): field is AssetDefaultField => field !== null,
    );
  }
}
