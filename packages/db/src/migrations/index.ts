import type { Migration, MigrationProvider } from 'kysely/migration';
import type { DatabaseDialect } from '../config/database-config.js';
import * as initialMigration from './0001_initial.js';
import * as usernameAccountsMigration from './0002_username_accounts.js';
import * as characterCardsMigration from './0003_character_cards.js';

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
};

export function createMigrationProvider(dialect: DatabaseDialect): MigrationProvider {
  return {
    async getMigrations() {
      await Promise.resolve();

      return Object.fromEntries(
        Object.entries(migrations).map(([name, migration]) => [name, migration[dialect] ?? migration.common]),
      );
    },
  };
}
