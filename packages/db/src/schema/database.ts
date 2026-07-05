import type { CharactersTable } from './characters.js';
import type {
  PresetEntriesTable,
  PresetPromptItemsTable,
  PresetsTable,
} from './presets.js';
import type { MigrationLockTable, SessionsTable, UsersTable } from './users.js';

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  characters: CharactersTable;
  presets: PresetsTable;
  preset_entries: PresetEntriesTable;
  preset_prompt_items: PresetPromptItemsTable;
  migration_lock: MigrationLockTable;
}
