import { mkdirSync } from 'node:fs';
import path from 'node:path';
import DatabaseDriver = require('better-sqlite3');
import { Kysely, SqliteDialect } from 'kysely';
import type { Database } from '../schema/database.js';

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
