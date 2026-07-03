import type { Kysely } from 'kysely';
import type { DatabaseConfig } from '../config/database-config.js';
import type { Database } from '../schema/database.js';
import { createSqliteDatabase } from './sqlite.js';

export function createDatabase(config: DatabaseConfig): Kysely<Database> {
  switch (config.dialect) {
    case 'sqlite':
      return createSqliteDatabase({ databasePath: config.databasePath });
    case 'postgres':
    case 'mysql':
      throw new Error(`Database dialect "${config.dialect}" is not implemented yet.`);
  }
}
