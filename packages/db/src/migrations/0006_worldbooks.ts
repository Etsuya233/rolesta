import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('worldbooks')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'varchar(255)', (column) =>
      column.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('visibility', 'varchar(32)', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('description', 'text', (column) => column.notNull())
    .addColumn('tags_json', 'text', (column) => column.notNull())
    .addColumn('scan_depth', 'integer', (column) => column.notNull())
    .addColumn('token_budget', 'integer', (column) => column.notNull())
    .addColumn('recursive_scan', 'integer', (column) => column.notNull())
    .addColumn('source_format', 'varchar(64)', (column) => column.notNull())
    .addColumn('source_snapshot_json', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .addColumn('last_used_at_ms', 'integer')
    .addColumn('usage_count', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('worldbook_entries')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('worldbook_id', 'varchar(255)', (column) =>
      column.notNull().references('worldbooks.id').onDelete('cascade'),
    )
    .addColumn('enabled', 'integer', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('comment', 'text', (column) => column.notNull())
    .addColumn('content', 'text', (column) => column.notNull())
    .addColumn('primary_keys_json', 'text', (column) => column.notNull())
    .addColumn('secondary_keys_json', 'text', (column) => column.notNull())
    .addColumn('selective', 'integer', (column) => column.notNull())
    .addColumn('constant', 'integer', (column) => column.notNull())
    .addColumn('case_sensitive', 'integer', (column) => column.notNull())
    .addColumn('match_whole_words', 'integer', (column) => column.notNull())
    .addColumn('insertion_position', 'varchar(32)', (column) => column.notNull())
    .addColumn('insertion_order', 'integer', (column) => column.notNull())
    .addColumn('depth', 'integer', (column) => column.notNull())
    .addColumn('probability', 'integer', (column) => column.notNull())
    .addColumn('token_count', 'integer', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createIndex('worldbooks_owner_updated_idx')
    .on('worldbooks')
    .columns(['owner_user_id', 'updated_at_ms'])
    .execute();
  await db.schema
    .createIndex('worldbooks_visibility_idx')
    .on('worldbooks')
    .column('visibility')
    .execute();
  await db.schema
    .createIndex('worldbooks_updated_idx')
    .on('worldbooks')
    .column('updated_at_ms')
    .execute();
  await db.schema.createIndex('worldbooks_name_idx').on('worldbooks').column('name').execute();
  await db.schema
    .createIndex('worldbooks_usage_count_idx')
    .on('worldbooks')
    .column('usage_count')
    .execute();
  await db.schema
    .createIndex('worldbook_entries_order_idx')
    .on('worldbook_entries')
    .columns(['worldbook_id', 'insertion_order'])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('worldbook_entries_order_idx').ifExists().execute();
  await db.schema.dropIndex('worldbooks_usage_count_idx').ifExists().execute();
  await db.schema.dropIndex('worldbooks_name_idx').ifExists().execute();
  await db.schema.dropIndex('worldbooks_updated_idx').ifExists().execute();
  await db.schema.dropIndex('worldbooks_visibility_idx').ifExists().execute();
  await db.schema.dropIndex('worldbooks_owner_updated_idx').ifExists().execute();
  await db.schema.dropTable('worldbook_entries').ifExists().execute();
  await db.schema.dropTable('worldbooks').ifExists().execute();
}
