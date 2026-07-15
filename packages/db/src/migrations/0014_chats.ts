import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('chats')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'varchar(255)', (column) =>
      column.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('title', 'varchar(512)', (column) => column.notNull())
    .addColumn('chat_character_id', 'varchar(255)', (column) =>
      column.references('characters.id').onDelete('set null'),
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
    .addColumn('created_at_ms', 'bigint', (column) => column.notNull())
    .addColumn('updated_at_ms', 'bigint', (column) => column.notNull())
    .execute();

  await db.schema
    .createIndex('chats_owner_updated_id_idx')
    .on('chats')
    .columns(['owner_user_id', 'updated_at_ms', 'id'])
    .execute();
  await db.schema
    .createIndex('chats_owner_created_id_idx')
    .on('chats')
    .columns(['owner_user_id', 'created_at_ms', 'id'])
    .execute();
  await db.schema
    .createIndex('chats_owner_title_id_idx')
    .on('chats')
    .columns(['owner_user_id', 'title', 'id'])
    .execute();
  await db.schema
    .createIndex('chats_owner_character_idx')
    .on('chats')
    .columns(['owner_user_id', 'chat_character_id'])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('chats').execute();
}
