import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('email', 'varchar(255)', (column) => column.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (column) => column.notNull())
    .addColumn('display_name', 'varchar(255)', (column) => column.notNull())
    .addColumn('role', 'varchar(255)', (column) => column.notNull())
    .addColumn('created_at', 'varchar(255)', (column) => column.notNull())
    .addColumn('updated_at', 'varchar(255)', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('sessions')
    .ifNotExists()
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('user_id', 'varchar(255)', (column) => column.notNull().references('users.id').onDelete('cascade'))
    .addColumn('expires_at', 'varchar(255)', (column) => column.notNull())
    .addColumn('created_at', 'varchar(255)', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('migration_lock')
    .ifNotExists()
    .addColumn('id', 'integer', (column) => column.primaryKey().autoIncrement())
    .addColumn('locked_at', 'varchar(255)', (column) => column.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('sessions').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
  await db.schema.dropTable('migration_lock').ifExists().execute();
}
