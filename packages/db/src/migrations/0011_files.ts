import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('file_resources')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'varchar(255)', (column) =>
      column.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('purpose', 'varchar(255)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('orphaned_at_ms', 'integer')
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('file_objects')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('resource_id', 'varchar(255)', (column) =>
      column.notNull().references('file_resources.id').onDelete('cascade'),
    )
    .addColumn('role', 'varchar(255)', (column) => column.notNull())
    .addColumn('visibility', 'varchar(16)', (column) => column.notNull())
    .addColumn('media_type', 'varchar(255)', (column) => column.notNull())
    .addColumn('byte_size', 'integer', (column) => column.notNull())
    .addColumn('width', 'integer')
    .addColumn('height', 'integer')
    .addColumn('content_hash', 'varchar(64)', (column) => column.notNull())
    .addColumn('storage_key', 'varchar(255)', (column) => column.notNull().unique())
    .addColumn('original_file_name', 'text')
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addUniqueConstraint('file_objects_resource_role_unique', ['resource_id', 'role'])
    .execute();

  await db.schema
    .createTable('file_contents')
    .addColumn('storage_key', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('content', 'blob', (column) => column.notNull())
    .execute();

  await db.schema
    .createIndex('file_resources_cleanup_idx')
    .on('file_resources')
    .columns(['status', 'orphaned_at_ms', 'created_at_ms'])
    .execute();
  await db.schema
    .createIndex('file_objects_resource_idx')
    .on('file_objects')
    .column('resource_id')
    .execute();

  await db.schema
    .alterTable('users')
    .addColumn('avatar_resource_id', 'varchar(255)', (column) =>
      column.references('file_resources.id').onDelete('set null'),
    )
    .execute();
  await db.schema
    .alterTable('characters')
    .addColumn('avatar_resource_id', 'varchar(255)', (column) =>
      column.references('file_resources.id').onDelete('set null'),
    )
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('characters').dropColumn('avatar_resource_id').execute();
  await db.schema.alterTable('users').dropColumn('avatar_resource_id').execute();
  await db.schema.dropIndex('file_objects_resource_idx').ifExists().execute();
  await db.schema.dropIndex('file_resources_cleanup_idx').ifExists().execute();
  await db.schema.dropTable('file_contents').ifExists().execute();
  await db.schema.dropTable('file_objects').ifExists().execute();
  await db.schema.dropTable('file_resources').ifExists().execute();
}
