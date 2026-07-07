import { sql, type Kysely } from "kysely";
import type { Database } from "../schema/database.js";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("external_uid", "integer")
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("add_memo", "integer", (column) => column.notNull().defaultTo(1))
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("condition_logic", "varchar(32)", (column) =>
      column.notNull().defaultTo("andAny"),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("vectorized", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("depth_role", "varchar(32)", (column) =>
      column.notNull().defaultTo("system"),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("display_order", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("use_probability", "integer", (column) =>
      column.notNull().defaultTo(1),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("scan_depth", "integer")
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("recursive_scan", "integer", (column) =>
      column.notNull().defaultTo(1),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("prevent_further_recursion", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("delay_until_recursion", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("recursion_delay_level", "integer")
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("ignore_budget", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("entry_group", "text", (column) =>
      column.notNull().defaultTo(""),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("group_override", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("group_weight", "integer", (column) =>
      column.notNull().defaultTo(100),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("use_group_scoring", "varchar(32)", (column) =>
      column.notNull().defaultTo("inherit"),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("sticky", "integer", (column) => column.defaultTo(0))
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("cooldown", "integer", (column) => column.defaultTo(0))
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("delay", "integer", (column) => column.defaultTo(0))
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("match_persona_description", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("match_character_description", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("match_character_personality", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("match_scenario", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("match_creator_notes", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("match_character_depth_prompt", "integer", (column) =>
      column.notNull().defaultTo(0),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("automation_id", "text", (column) =>
      column.notNull().defaultTo(""),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("generation_triggers_json", "text", (column) =>
      column.notNull().defaultTo("[]"),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("outlet_name", "text", (column) =>
      column.notNull().defaultTo(""),
    )
    .execute();
  await db.schema
    .alterTable("worldbook_entries")
    .addColumn("character_filter_json", "text", (column) =>
      column.notNull().defaultTo('{"isExclude":false,"names":[],"tags":[]}'),
    )
    .execute();

  await sql`
    update worldbook_entries
    set
      insertion_position = case insertion_position
        when 'beforeChar' then 'beforeCharacterDefinition'
        when 'afterChar' then 'afterCharacterDefinition'
        when 'beforeHistory' then 'beforeAuthorNote'
        when 'afterHistory' then 'afterAuthorNote'
        else insertion_position
      end,
      display_order = insertion_order,
      case_sensitive = case case_sensitive
        when 1 then 'enabled'
        when '1' then 'enabled'
        when 'enabled' then 'enabled'
        when 'inherit' then 'inherit'
        else 'disabled'
      end,
      match_whole_words = case match_whole_words
        when 1 then 'enabled'
        when '1' then 'enabled'
        when 'enabled' then 'enabled'
        when 'inherit' then 'inherit'
        else 'disabled'
      end
  `.execute(db);

  await db.schema
    .createIndex("worldbook_entries_display_order_idx")
    .on("worldbook_entries")
    .columns(["worldbook_id", "display_order"])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .dropIndex("worldbook_entries_display_order_idx")
    .ifExists()
    .execute();

  for (const column of columnsAddedByMigration) {
    await db.schema
      .alterTable("worldbook_entries")
      .dropColumn(column)
      .execute();
  }
}

const columnsAddedByMigration = [
  "character_filter_json",
  "outlet_name",
  "generation_triggers_json",
  "automation_id",
  "match_character_depth_prompt",
  "match_creator_notes",
  "match_scenario",
  "match_character_personality",
  "match_character_description",
  "match_persona_description",
  "delay",
  "cooldown",
  "sticky",
  "use_group_scoring",
  "group_weight",
  "group_override",
  "entry_group",
  "ignore_budget",
  "recursion_delay_level",
  "delay_until_recursion",
  "prevent_further_recursion",
  "recursive_scan",
  "scan_depth",
  "use_probability",
  "display_order",
  "depth_role",
  "vectorized",
  "condition_logic",
  "add_memo",
  "external_uid",
] as const;
