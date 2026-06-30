import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Migrator } from 'kysely';
import { createSqliteDatabase } from './dialects/sqlite.js';
import { toMigrationError } from './migration-error.js';
import { createMigrationProvider } from './migrations/index.js';

export async function migrateToLatest(databasePath: string): Promise<void> {
  await fs.mkdir(path.dirname(databasePath), { recursive: true });
  const db = createSqliteDatabase({ databasePath });

  try {
    const migrator = new Migrator({
      db,
      provider: createMigrationProvider(),
    });

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((result) => {
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const databasePath = process.env.SQLITE_DATABASE_PATH ?? '.data/rolesta.sqlite';
  await migrateToLatest(databasePath);
}
