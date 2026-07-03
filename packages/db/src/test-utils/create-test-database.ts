import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Migrator } from 'kysely/migration';
import { createSqliteDatabase } from '../dialects/sqlite.js';
import { toMigrationError } from '../migration-error.js';
import { createMigrationProvider } from '../migrations/index.js';

export async function createTestDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'rolesta-db-'));
  const databasePath = path.join(directory, 'test.sqlite');
  const db = createSqliteDatabase({ databasePath });

  const migrator = new Migrator({
    db,
    provider: createMigrationProvider(),
  });

  const { error } = await migrator.migrateToLatest();

  if (error) {
    await db.destroy();
    throw toMigrationError(error);
  }

  return {
    db,
    databasePath,
    async destroy() {
      await db.destroy();
      try {
        await fs.rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      } catch (error) {
        if (!isWindowsBusyError(error)) {
          throw error;
        }
      }
    },
  };
}

function isWindowsBusyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'EBUSY' || error.code === 'EPERM')
  );
}
