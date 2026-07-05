import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('presets')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'varchar(255)', (column) =>
      column.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('model_provider_id', 'varchar(255)')
    .addColumn('model_settings_json', 'text', (column) => column.notNull())
    .addColumn('tokenizer', 'varchar(64)', (column) => column.notNull())
    .addColumn('source_format', 'varchar(64)', (column) => column.notNull())
    .addColumn('source_snapshot_json', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .addColumn('last_used_at_ms', 'integer')
    .addColumn('usage_count', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('preset_entries')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('preset_id', 'varchar(255)', (column) =>
      column.notNull().references('presets.id').onDelete('cascade'),
    )
    .addColumn('identifier', 'varchar(255)', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('role', 'varchar(32)', (column) => column.notNull())
    .addColumn('position', 'varchar(32)', (column) => column.notNull())
    .addColumn('content', 'text', (column) => column.notNull())
    .addColumn('token_count', 'integer', (column) => column.notNull())
    .addColumn('metadata_json', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('preset_prompt_items')
    .addColumn('preset_id', 'varchar(255)', (column) =>
      column.notNull().references('presets.id').onDelete('cascade'),
    )
    .addColumn('entry_id', 'varchar(255)', (column) =>
      column.notNull().references('preset_entries.id').onDelete('cascade'),
    )
    .addColumn('enabled', 'integer', (column) => column.notNull())
    .addColumn('order_index', 'integer', (column) => column.notNull())
    .addPrimaryKeyConstraint('preset_prompt_items_pk', ['preset_id', 'entry_id'])
    .execute();

  await db.schema
    .createIndex('presets_owner_created_idx')
    .on('presets')
    .columns(['owner_user_id', 'created_at_ms'])
    .execute();
  await db.schema.createIndex('presets_updated_idx').on('presets').column('updated_at_ms').execute();
  await db.schema.createIndex('presets_name_idx').on('presets').column('name').execute();
  await db.schema.createIndex('presets_last_used_idx').on('presets').column('last_used_at_ms').execute();
  await db.schema.createIndex('presets_usage_count_idx').on('presets').column('usage_count').execute();
  await db.schema
    .createIndex('preset_entries_preset_idx')
    .on('preset_entries')
    .column('preset_id')
    .execute();
  await db.schema
    .createIndex('preset_entries_identifier_idx')
    .on('preset_entries')
    .columns(['preset_id', 'identifier'])
    .execute();
  await db.schema
    .createIndex('preset_prompt_items_order_idx')
    .on('preset_prompt_items')
    .columns(['preset_id', 'order_index'])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('preset_prompt_items_order_idx').ifExists().execute();
  await db.schema.dropIndex('preset_entries_identifier_idx').ifExists().execute();
  await db.schema.dropIndex('preset_entries_preset_idx').ifExists().execute();
  await db.schema.dropIndex('presets_usage_count_idx').ifExists().execute();
  await db.schema.dropIndex('presets_last_used_idx').ifExists().execute();
  await db.schema.dropIndex('presets_name_idx').ifExists().execute();
  await db.schema.dropIndex('presets_updated_idx').ifExists().execute();
  await db.schema.dropIndex('presets_owner_created_idx').ifExists().execute();
  await db.schema.dropTable('preset_prompt_items').ifExists().execute();
  await db.schema.dropTable('preset_entries').ifExists().execute();
  await db.schema.dropTable('presets').ifExists().execute();
}
