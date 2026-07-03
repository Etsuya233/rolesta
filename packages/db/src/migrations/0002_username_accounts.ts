import { sql, type Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('users_next')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('username', 'varchar(255)', (column) => column.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (column) => column.notNull())
    .addColumn('display_name', 'varchar(255)', (column) => column.notNull())
    .addColumn('role', 'varchar(255)', (column) => column.notNull())
    .addColumn('created_at', 'varchar(255)', (column) => column.notNull())
    .addColumn('updated_at', 'varchar(255)', (column) => column.notNull())
    .execute();

  await sql`
    insert into users_next (id, username, password_hash, display_name, role, created_at, updated_at)
    select id, email, password_hash, display_name, role, created_at, updated_at
    from users
  `.execute(db);

  await db.schema.dropTable('users').execute();
  await db.schema.alterTable('users_next').renameTo('users').execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('users_previous')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('email', 'varchar(255)', (column) => column.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (column) => column.notNull())
    .addColumn('display_name', 'varchar(255)', (column) => column.notNull())
    .addColumn('role', 'varchar(255)', (column) => column.notNull())
    .addColumn('created_at', 'varchar(255)', (column) => column.notNull())
    .addColumn('updated_at', 'varchar(255)', (column) => column.notNull())
    .execute();

  await sql`
    insert into users_previous (id, email, password_hash, display_name, role, created_at, updated_at)
    select id, username, password_hash, display_name, role, created_at, updated_at
    from users
  `.execute(db);

  await db.schema.dropTable('users').execute();
  await db.schema.alterTable('users_previous').renameTo('users').execute();
}
