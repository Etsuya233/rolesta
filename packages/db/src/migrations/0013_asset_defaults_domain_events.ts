import { sql, type Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('asset_defaults_without_asset_foreign_keys')
    .addColumn('user_id', 'varchar(255)', (column) =>
      column.primaryKey().references('users.id').onDelete('cascade'),
    )
    .addColumn('persona_character_id', 'varchar(255)')
    .addColumn('preset_id', 'varchar(255)')
    .addColumn('model_provider_id', 'varchar(255)')
    .execute();

  await sql`
    insert into asset_defaults_without_asset_foreign_keys (
      user_id,
      persona_character_id,
      preset_id,
      model_provider_id
    )
    select
      user_id,
      persona_character_id,
      preset_id,
      model_provider_id
    from asset_defaults
  `.execute(db);

  await db.schema.dropTable('asset_defaults').execute();
  await db.schema
    .alterTable('asset_defaults_without_asset_foreign_keys')
    .renameTo('asset_defaults')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('asset_defaults_with_asset_foreign_keys')
    .addColumn('user_id', 'varchar(255)', (column) =>
      column.primaryKey().references('users.id').onDelete('cascade'),
    )
    .addColumn('persona_character_id', 'varchar(255)', (column) =>
      column.references('characters.id').onDelete('set null'),
    )
    .addColumn('preset_id', 'varchar(255)', (column) =>
      column.references('presets.id').onDelete('set null'),
    )
    .addColumn('model_provider_id', 'varchar(255)', (column) =>
      column.references('model_provider_configs.id').onDelete('set null'),
    )
    .execute();

  await sql`
    insert into asset_defaults_with_asset_foreign_keys (
      user_id,
      persona_character_id,
      preset_id,
      model_provider_id
    )
    select
      user_id,
      persona_character_id,
      preset_id,
      model_provider_id
    from asset_defaults
  `.execute(db);

  await db.schema.dropTable('asset_defaults').execute();
  await db.schema
    .alterTable('asset_defaults_with_asset_foreign_keys')
    .renameTo('asset_defaults')
    .execute();
}
