import type { MigrationProvider } from 'kysely';
import * as initialMigration from './0001_initial.js';

export function createMigrationProvider(): MigrationProvider {
  return {
    async getMigrations() {
      await Promise.resolve();

      return {
        '0001_initial': initialMigration,
      };
    },
  };
}
