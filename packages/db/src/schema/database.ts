import type { CharactersTable } from './characters.js';
import type {
  ModelProviderApiKeysTable,
  ModelProviderConfigsTable,
} from './model-providers.js';
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
  model_provider_configs: ModelProviderConfigsTable;
  model_provider_api_keys: ModelProviderApiKeysTable;
  presets: PresetsTable;
  preset_entries: PresetEntriesTable;
  preset_prompt_items: PresetPromptItemsTable;
  migration_lock: MigrationLockTable;
}
