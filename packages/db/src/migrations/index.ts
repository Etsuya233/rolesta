import type { MigrationProvider } from 'kysely/migration';
import * as initialMigration from './0001_initial.js';
import * as usernameAccountsMigration from './0002_username_accounts.js';

export function createMigrationProvider(): MigrationProvider {
  return {
    async getMigrations() {
      await Promise.resolve();

      return {
        '0001_initial': initialMigration,
        '0002_username_accounts': usernameAccountsMigration,
      };
    },
  };
}
