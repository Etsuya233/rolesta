import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('selective_logic', 'varchar(32)', (column) => column.notNull().defaultTo('andAny'))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('entry_scan_depth', 'integer')
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('exclude_recursion', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('prevent_recursion', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('delay_until_recursion', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('insertion_role', 'varchar(32)', (column) => column.notNull().defaultTo('system'))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('anchor_name', 'text', (column) => column.notNull().defaultTo(''))
    .execute();

  await db
    .updateTable('worldbook_entries')
    .set({ insertion_position: 'beforeCharacterDefinition' })
    .where('insertion_position', '=', 'beforeChar' as never)
    .execute();
  await db
    .updateTable('worldbook_entries')
    .set({ insertion_position: 'afterCharacterDefinition' })
    .where('insertion_position', '=', 'afterChar' as never)
    .execute();
  await db
    .updateTable('worldbook_entries')
    .set({ insertion_position: 'beforeAuthorsNote' })
    .where('insertion_position', '=', 'beforeHistory' as never)
    .execute();
  await db
    .updateTable('worldbook_entries')
    .set({ insertion_position: 'afterAuthorsNote' })
    .where('insertion_position', '=', 'afterHistory' as never)
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db
    .updateTable('worldbook_entries')
    .set({ insertion_position: 'beforeChar' as never })
    .where('insertion_position', '=', 'beforeCharacterDefinition')
    .execute();
  await db
    .updateTable('worldbook_entries')
    .set({ insertion_position: 'afterChar' as never })
    .where('insertion_position', '=', 'afterCharacterDefinition')
    .execute();
  await db
    .updateTable('worldbook_entries')
    .set({ insertion_position: 'beforeHistory' as never })
    .where('insertion_position', '=', 'beforeAuthorsNote')
    .execute();
  await db
    .updateTable('worldbook_entries')
    .set({ insertion_position: 'afterHistory' as never })
    .where('insertion_position', '=', 'afterAuthorsNote')
    .execute();

  await db.schema.alterTable('worldbook_entries').dropColumn('anchor_name').execute();
  await db.schema.alterTable('worldbook_entries').dropColumn('insertion_role').execute();
  await db.schema.alterTable('worldbook_entries').dropColumn('delay_until_recursion').execute();
  await db.schema.alterTable('worldbook_entries').dropColumn('prevent_recursion').execute();
  await db.schema.alterTable('worldbook_entries').dropColumn('exclude_recursion').execute();
  await db.schema.alterTable('worldbook_entries').dropColumn('entry_scan_depth').execute();
  await db.schema.alterTable('worldbook_entries').dropColumn('selective_logic').execute();
}
