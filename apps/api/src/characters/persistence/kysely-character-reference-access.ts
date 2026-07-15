import { Inject, Injectable } from "@nestjs/common";
import type { AppConfig } from "../../config/app-config.js";
import { APP_CONFIG } from "../../config/config.module.js";
import { KyselyDatabaseContext } from "../../database/kysely-database-context.js";
import type { CharacterReferenceAccess } from "../contracts/character-reference-access.js";

@Injectable()
export class KyselyCharacterReferenceAccess
  implements CharacterReferenceAccess
{
  constructor(
    private readonly context: KyselyDatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async acquireVisible(
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
}
