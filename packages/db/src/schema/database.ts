import type { CharactersTable } from './characters.js';
import type { MigrationLockTable, SessionsTable, UsersTable } from './users.js';

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  characters: CharactersTable;
  migration_lock: MigrationLockTable;
}
