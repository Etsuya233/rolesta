import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('presets')
    .addColumn('visibility', 'varchar(16)', (column) => column.notNull().defaultTo('private'))
    .execute();

  await db.schema
    .createIndex('presets_visibility_created_idx')
    .on('presets')
    .columns(['visibility', 'created_at_ms'])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('presets_visibility_created_idx').ifExists().execute();
  await db.schema.alterTable('presets').dropColumn('visibility').execute();
}
