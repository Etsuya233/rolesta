import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('model_provider_configs')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'varchar(255)', (column) =>
      column.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('provider_kind', 'varchar(64)', (column) => column.notNull())
    .addColumn('provider_source', 'varchar(32)', (column) => column.notNull())
    .addColumn('base_url', 'text', (column) => column.notNull())
    .addColumn('default_model_name', 'varchar(255)', (column) => column.notNull())
    .addColumn('selected_api_key_id', 'varchar(255)')
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .addColumn('last_used_at_ms', 'integer')
    .addColumn('usage_count', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('model_provider_api_keys')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('config_id', 'varchar(255)', (column) =>
      column.notNull().references('model_provider_configs.id').onDelete('cascade'),
    )
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('secret', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createIndex('model_provider_configs_owner_created_idx')
    .on('model_provider_configs')
    .columns(['owner_user_id', 'created_at_ms'])
    .execute();
  await db.schema
    .createIndex('model_provider_configs_updated_idx')
    .on('model_provider_configs')
    .column('updated_at_ms')
    .execute();
  await db.schema
    .createIndex('model_provider_configs_name_idx')
    .on('model_provider_configs')
    .column('name')
    .execute();
  await db.schema
    .createIndex('model_provider_api_keys_config_idx')
    .on('model_provider_api_keys')
    .column('config_id')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('model_provider_api_keys_config_idx').ifExists().execute();
  await db.schema.dropIndex('model_provider_configs_name_idx').ifExists().execute();
  await db.schema.dropIndex('model_provider_configs_updated_idx').ifExists().execute();
  await db.schema.dropIndex('model_provider_configs_owner_created_idx').ifExists().execute();
  await db.schema.dropTable('model_provider_api_keys').ifExists().execute();
  await db.schema.dropTable('model_provider_configs').ifExists().execute();
}
