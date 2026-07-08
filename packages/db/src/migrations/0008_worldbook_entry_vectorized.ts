import type { Kysely } from "kysely";
import type { Database } from "../schema/database.js";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("vectorized", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("worldbook_entries")
    .dropColumn("vectorized")
    .execute();
}
