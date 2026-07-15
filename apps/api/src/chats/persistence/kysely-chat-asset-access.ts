import { Inject, Injectable } from "@nestjs/common";
import type { AppConfig } from "../../config/app-config.js";
import { APP_CONFIG } from "../../config/config.module.js";
import { KyselyDatabaseContext } from "../../database/kysely-database-context.js";
import type { ChatAssetAccess } from "../ports/chat-asset-access.js";

@Injectable()
export class KyselyChatAssetAccess implements ChatAssetAccess {
  constructor(
    private readonly context: KyselyDatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async acquireVisibleCharacter(
    characterId: string,
    viewerUserId: string,
  ): Promise<boolean> {
    let query = this.context.database
      .selectFrom("characters")
      .select("id")
      .where("id", "=", characterId)
      .where((builder) =>
        builder.or([
          builder("owner_user_id", "=", viewerUserId),
          builder("visibility", "=", "public"),
        ]),
      );
    if (this.config.database.dialect !== "sqlite") query = query.forUpdate();
    return (await query.executeTakeFirst()) !== undefined;
  }

  async acquireVisiblePreset(
    presetId: string,
    viewerUserId: string,
  ): Promise<boolean> {
    let query = this.context.database
      .selectFrom("presets")
      .select("id")
      .where("id", "=", presetId)
      .where((builder) =>
        builder.or([
          builder("owner_user_id", "=", viewerUserId),
          builder("visibility", "=", "public"),
        ]),
      );
    if (this.config.database.dialect !== "sqlite") query = query.forUpdate();
    return (await query.executeTakeFirst()) !== undefined;
  }

  async acquireOwnedModelProvider(
    modelProviderId: string,
    ownerUserId: string,
  ): Promise<boolean> {
    let query = this.context.database
      .selectFrom("model_provider_configs")
      .select("id")
      .where("id", "=", modelProviderId)
      .where("owner_user_id", "=", ownerUserId);
    if (this.config.database.dialect !== "sqlite") query = query.forUpdate();
    return (await query.executeTakeFirst()) !== undefined;
  }
}
