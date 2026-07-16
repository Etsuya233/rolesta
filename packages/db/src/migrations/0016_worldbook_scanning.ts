import { sql, type Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('worldbooks').dropColumn('scan_depth').execute();
  await db.schema.alterTable('worldbooks').dropColumn('token_budget').execute();
  await db.schema.alterTable('worldbooks').dropColumn('recursive_scan').execute();

  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('display_index', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db
    .updateTable('worldbook_entries')
    .set({ display_index: sql<number>`insertion_order`, insertion_order: 100 })
    .execute();

  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('ignore_budget', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('use_probability', 'integer', (column) => column.notNull().defaultTo(1))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('match_persona_description', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('match_character_description', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('match_character_personality', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('match_character_depth_prompt', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('match_scenario', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('match_creator_notes', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('group_name', 'text', (column) => column.notNull().defaultTo(''))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('group_override', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('group_weight', 'integer', (column) => column.notNull().defaultTo(100))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('use_group_scoring', 'integer')
    .execute();
  await db.schema.alterTable('worldbook_entries').addColumn('sticky', 'integer').execute();
  await db.schema.alterTable('worldbook_entries').addColumn('cooldown', 'integer').execute();
  await db.schema.alterTable('worldbook_entries').addColumn('delay', 'integer').execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('character_filter_names_json', 'text', (column) => column.notNull().defaultTo('[]'))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('character_filter_tags_json', 'text', (column) => column.notNull().defaultTo('[]'))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('character_filter_exclude', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('triggers_json', 'text', (column) => column.notNull().defaultTo('[]'))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('automation_id', 'text', (column) => column.notNull().defaultTo(''))
    .execute();
  await db.schema
    .alterTable('worldbook_entries')
    .addColumn('add_memo', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createTable('worldbook_scan_preferences')
    .addColumn('user_id', 'varchar(255)', (column) =>
      column.primaryKey().references('users.id').onDelete('cascade'),
    )
    .addColumn('scan_depth', 'integer', (column) => column.notNull())
    .addColumn('min_activations', 'integer', (column) => column.notNull())
    .addColumn('min_activations_depth_max', 'integer', (column) => column.notNull())
    .addColumn('budget_percent', 'integer', (column) => column.notNull())
    .addColumn('budget_cap', 'integer', (column) => column.notNull())
    .addColumn('recursive', 'integer', (column) => column.notNull())
    .addColumn('case_sensitive', 'integer', (column) => column.notNull())
    .addColumn('match_whole_words', 'integer', (column) => column.notNull())
    .addColumn('use_group_scoring', 'integer', (column) => column.notNull())
    .addColumn('max_recursion_steps', 'integer', (column) => column.notNull())
    .addColumn('include_names', 'integer', (column) => column.notNull())
    .addColumn('character_lore_insertion_strategy', 'varchar(32)', (column) => column.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('worldbook_scan_preferences').ifExists().execute();
  await db
    .updateTable('worldbook_entries')
    .set({ insertion_order: sql<number>`display_index` })
    .execute();
  await db.schema.alterTable('worldbook_entries').dropColumn('display_index').execute();
  await db.schema
    .alterTable('worldbooks')
    .addColumn('scan_depth', 'integer', (column) => column.notNull().defaultTo(3))
    .execute();
  await db.schema
    .alterTable('worldbooks')
    .addColumn('token_budget', 'integer', (column) => column.notNull().defaultTo(1024))
    .execute();
  await db.schema
    .alterTable('worldbooks')
    .addColumn('recursive_scan', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();

  for (const column of [
    'ignore_budget',
    'use_probability',
    'match_persona_description',
    'match_character_description',
    'match_character_personality',
    'match_character_depth_prompt',
    'match_scenario',
    'match_creator_notes',
    'group_name',
    'group_override',
    'group_weight',
    'use_group_scoring',
    'sticky',
    'cooldown',
    'delay',
    'character_filter_names_json',
    'character_filter_tags_json',
    'character_filter_exclude',
    'triggers_json',
    'automation_id',
    'add_memo',
  ] as const) {
    await db.schema.alterTable('worldbook_entries').dropColumn(column).execute();
  }
}
