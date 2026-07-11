import type { CharactersTable } from "./characters.js";
import type {
  ApiKeysTable,
  ModelProviderConfigsTable,
} from "./model-providers.js";
import type {
  PresetEntriesTable,
  PresetPromptItemsTable,
  PresetsTable,
} from "./presets.js";
import type { MigrationLockTable, SessionsTable, UsersTable } from "./users.js";
import type { WorldbookEntriesTable, WorldbooksTable } from "./worldbooks.js";

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  characters: CharactersTable;
  model_provider_configs: ModelProviderConfigsTable;
  api_keys: ApiKeysTable;
  presets: PresetsTable;
  preset_entries: PresetEntriesTable;
  preset_prompt_items: PresetPromptItemsTable;
  worldbooks: WorldbooksTable;
  worldbook_entries: WorldbookEntriesTable;
  migration_lock: MigrationLockTable;
}
