import type { CharactersTable } from './characters.js';
import type { ChatsTable } from './chats.js';
import type { AssetDefaultsTable } from './asset-defaults.js';
import type { ApiKeysTable, ModelProviderConfigsTable } from './model-providers.js';
import type { PresetEntriesTable, PresetPromptItemsTable, PresetsTable } from './presets.js';
import type { MigrationLockTable, SessionsTable, UsersTable } from './users.js';
import type {
  WorldbookEntriesTable,
  WorldbookScanPreferencesTable,
  WorldbooksTable,
} from './worldbooks.js';
import type { FileContentsTable, FileObjectsTable, FileResourcesTable } from './files.js';

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  asset_defaults: AssetDefaultsTable;
  characters: CharactersTable;
  chats: ChatsTable;
  model_provider_configs: ModelProviderConfigsTable;
  api_keys: ApiKeysTable;
  presets: PresetsTable;
  preset_entries: PresetEntriesTable;
  preset_prompt_items: PresetPromptItemsTable;
  worldbooks: WorldbooksTable;
  worldbook_entries: WorldbookEntriesTable;
  worldbook_scan_preferences: WorldbookScanPreferencesTable;
  file_resources: FileResourcesTable;
  file_objects: FileObjectsTable;
  file_contents: FileContentsTable;
  migration_lock: MigrationLockTable;
}
