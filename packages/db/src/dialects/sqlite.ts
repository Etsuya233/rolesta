import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Kysely, SqliteDialect } from 'kysely';
import type DatabaseDriverType from 'better-sqlite3';
import type { Database } from '../schema/database.js';

const require = createRequire(import.meta.url);
const DatabaseDriver = require('better-sqlite3') as typeof DatabaseDriverType;

export interface SqliteDatabaseOptions {
  databasePath: string;
}

export function createSqliteDatabase(options: SqliteDatabaseOptions): Kysely<Database> {
  mkdirSync(path.dirname(options.databasePath), { recursive: true });

  return new Kysely<Database>({
    dialect: new SqliteDialect({
      database: new DatabaseDriver(options.databasePath),
    }),
  });
}
