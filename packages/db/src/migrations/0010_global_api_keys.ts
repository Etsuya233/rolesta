import { sql, type Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('api_keys')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'varchar(255)', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('secret', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'bigint', (column) => column.notNull())
    .addColumn('updated_at_ms', 'bigint', (column) => column.notNull())
    .execute();
  await db.schema
    .createIndex('api_keys_owner_idx')
    .on('api_keys')
    .column('owner_user_id')
    .execute();
  await db.schema
    .alterTable('model_provider_configs')
    .addColumn('credential_mode', 'varchar(20)', (column) => column.notNull().defaultTo('manual'))
    .execute();
  await db.schema
    .alterTable('model_provider_configs')
    .addColumn('secret', 'text', (column) => column.notNull().defaultTo(''))
    .execute();
  await db.schema
    .alterTable('model_provider_configs')
    .addColumn('api_key_id', 'varchar(255)')
    .execute();

  await sql`
    insert into api_keys (id, owner_user_id, name, secret, created_at_ms, updated_at_ms)
    select keys.id, configs.owner_user_id, keys.name, keys.secret, keys.created_at_ms, keys.updated_at_ms
    from model_provider_api_keys keys
    inner join model_provider_configs configs on configs.id = keys.config_id
  `.execute(db);
  await sql`
    update model_provider_configs
    set credential_mode = case when selected_api_key_id is null then 'manual' else 'vault' end,
        api_key_id = selected_api_key_id
  `.execute(db);

  await db.schema.alterTable('model_provider_configs').dropColumn('selected_api_key_id').execute();
  await db.schema.dropTable('model_provider_api_keys').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('model_provider_api_keys')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('config_id', 'varchar(255)', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('secret', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'bigint', (column) => column.notNull())
    .addColumn('updated_at_ms', 'bigint', (column) => column.notNull())
    .execute();
  await db.schema
    .alterTable('model_provider_configs')
    .addColumn('selected_api_key_id', 'varchar(255)')
    .execute();
  await db.schema.alterTable('model_provider_configs').dropColumn('api_key_id').execute();
  await db.schema.alterTable('model_provider_configs').dropColumn('secret').execute();
  await db.schema.alterTable('model_provider_configs').dropColumn('credential_mode').execute();
  await db.schema.dropTable('api_keys').execute();
}
