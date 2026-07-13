import type { Kysely } from "kysely";
import type { Database } from "../schema/database.js";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("asset_defaults")
    .addColumn("user_id", "varchar(255)", (column) =>
      column.primaryKey().references("users.id").onDelete("cascade"),
    )
    .addColumn("persona_character_id", "varchar(255)", (column) =>
      column.references("characters.id").onDelete("set null"),
    )
    .addColumn("preset_id", "varchar(255)", (column) =>
      column.references("presets.id").onDelete("set null"),
    )
    .addColumn("model_provider_id", "varchar(255)", (column) =>
      column.references("model_provider_configs.id").onDelete("set null"),
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("asset_defaults").ifExists().execute();
}
