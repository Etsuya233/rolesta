import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Migrator, type MigrationResult } from 'kysely/migration';
import type { DatabaseConfig } from './config/database-config.js';
import { loadDatabaseConfig } from './config/database-config.js';
import { createDatabase } from './dialects/index.js';
import { toMigrationError } from './migration-error.js';
import { createMigrationProvider } from './migrations/index.js';

export async function migrateToLatest(config: DatabaseConfig = loadDatabaseConfig()): Promise<void> {
  const db = createDatabase(config);

  try {
    const migrator = new Migrator({
      db,
      provider: createMigrationProvider(config.dialect),
    });

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((result: MigrationResult) => {
      if (result.status === 'Success') {
        console.log(`Migration ${result.migrationName} completed`);
      }
    });

    if (error) {
      throw toMigrationError(error);
    }
  } finally {
    await db.destroy();
  }
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await migrateToLatest();
}
