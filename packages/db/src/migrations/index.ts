import type { Migration, MigrationProvider } from 'kysely/migration';
import type { DatabaseDialect } from '../config/database-config.js';
import * as initialMigration from './0001_initial.js';
import * as usernameAccountsMigration from './0002_username_accounts.js';
import * as characterCardsMigration from './0003_character_cards.js';
import * as presetsMigration from './0004_presets.js';
import * as modelProvidersMigration from './0005_model_providers.js';
import * as worldbooksMigration from './0006_worldbooks.js';
import * as worldbookEntryCompatibilityMigration from './0007_worldbook_entry_compatibility.js';
import * as worldbookEntryVectorizedMigration from './0008_worldbook_entry_vectorized.js';
import * as presetVisibilityMigration from './0009_preset_visibility.js';
import * as globalApiKeysMigration from './0010_global_api_keys.js';
import * as filesMigration from './0011_files.js';
import * as assetDefaultsMigration from './0012_asset_defaults.js';
import * as assetDefaultsDomainEventsMigration from './0013_asset_defaults_domain_events.js';
import * as chatsMigration from './0014_chats.js';

type DialectMigration = {
  common: Migration;
  sqlite?: Migration;
  postgres?: Migration;
  mysql?: Migration;
};

const migrations: Record<string, DialectMigration> = {
  '0001_initial': {
    common: initialMigration,
  },
  '0002_username_accounts': {
    common: usernameAccountsMigration,
  },
  '0003_character_cards': {
    common: characterCardsMigration,
  },
  '0004_presets': {
    common: presetsMigration,
  },
  '0005_model_providers': {
    common: modelProvidersMigration,
  },
  '0006_worldbooks': {
    common: worldbooksMigration,
  },
  '0007_worldbook_entry_compatibility': {
    common: worldbookEntryCompatibilityMigration,
  },
  '0008_worldbook_entry_vectorized': {
    common: worldbookEntryVectorizedMigration,
  },
  '0009_preset_visibility': {
    common: presetVisibilityMigration,
  },
  '0010_global_api_keys': {
    common: globalApiKeysMigration,
  },
  '0011_files': {
    common: filesMigration,
  },
  '0012_asset_defaults': {
    common: assetDefaultsMigration,
  },
  '0013_asset_defaults_domain_events': {
    common: assetDefaultsDomainEventsMigration,
  },
  '0014_chats': {
    common: chatsMigration,
  },
};

export function createMigrationProvider(dialect: DatabaseDialect): MigrationProvider {
  return {
    async getMigrations() {
      await Promise.resolve();

      return Object.fromEntries(
        Object.entries(migrations).map(([name, migration]) => [
          name,
          migration[dialect] ?? migration.common,
        ]),
      );
    },
  };
}
