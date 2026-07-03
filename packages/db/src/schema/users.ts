import type { Generated } from 'kysely';

export interface UsersTable {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface SessionsTable {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface MigrationLockTable {
  id: Generated<number>;
  locked_at: string;
}
