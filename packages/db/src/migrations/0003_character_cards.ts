import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('characters')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'varchar(255)', (column) =>
      column.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('visibility', 'varchar(16)', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('nickname', 'varchar(255)')
    .addColumn('comment', 'text', (column) => column.notNull())
    .addColumn('tags_json', 'text', (column) => column.notNull())
    .addColumn('version', 'varchar(255)', (column) => column.notNull())
    .addColumn('creator', 'varchar(255)')
    .addColumn('description', 'text', (column) => column.notNull())
    .addColumn('personality', 'text', (column) => column.notNull())
    .addColumn('scenario', 'text', (column) => column.notNull())
    .addColumn('first_message', 'text', (column) => column.notNull())
    .addColumn('alternate_greetings_json', 'text', (column) => column.notNull())
    .addColumn('group_only_greetings_json', 'text', (column) => column.notNull())
    .addColumn('message_example', 'text', (column) => column.notNull())
    .addColumn('creator_notes', 'text', (column) => column.notNull())
    .addColumn('creator_notes_multilingual_json', 'text', (column) => column.notNull())
    .addColumn('system_prompt', 'text', (column) => column.notNull())
    .addColumn('post_history_instructions', 'text', (column) => column.notNull())
    .addColumn('character_book_json', 'text')
    .addColumn('assets_json', 'text', (column) => column.notNull())
    .addColumn('source_json', 'text', (column) => column.notNull())
    .addColumn('metadata_json', 'text', (column) => column.notNull())
    .addColumn('source_format', 'varchar(32)', (column) => column.notNull())
    .addColumn('source_snapshot_json', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .addColumn('creation_date_ms', 'integer')
    .addColumn('modification_date_ms', 'integer')
    .addColumn('last_used_at_ms', 'integer')
    .addColumn('usage_count', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createIndex('characters_owner_created_idx')
    .on('characters')
    .columns(['owner_user_id', 'created_at_ms'])
    .execute();
  await db.schema
    .createIndex('characters_visibility_created_idx')
    .on('characters')
    .columns(['visibility', 'created_at_ms'])
    .execute();
  await db.schema
    .createIndex('characters_updated_idx')
    .on('characters')
    .column('updated_at_ms')
    .execute();
  await db.schema.createIndex('characters_name_idx').on('characters').column('name').execute();
  await db.schema
    .createIndex('characters_last_used_idx')
    .on('characters')
    .column('last_used_at_ms')
    .execute();
  await db.schema
    .createIndex('characters_usage_count_idx')
    .on('characters')
    .column('usage_count')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('characters_usage_count_idx').ifExists().execute();
  await db.schema.dropIndex('characters_last_used_idx').ifExists().execute();
  await db.schema.dropIndex('characters_name_idx').ifExists().execute();
  await db.schema.dropIndex('characters_updated_idx').ifExists().execute();
  await db.schema.dropIndex('characters_visibility_created_idx').ifExists().execute();
  await db.schema.dropIndex('characters_owner_created_idx').ifExists().execute();
  await db.schema.dropTable('characters').ifExists().execute();
}
