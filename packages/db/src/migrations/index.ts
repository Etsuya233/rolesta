import type { MigrationProvider } from 'kysely';
import * as initialMigration from './0001_initial.js';

export function createMigrationProvider(): MigrationProvider {
  return {
    async getMigrations() {
      return {
        '0001_initial': initialMigration,
      };
    },
  };
}
