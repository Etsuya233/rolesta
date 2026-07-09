import { Inject, Injectable } from '@nestjs/common';
import type { Database, UsersTable } from '@rolesta/db';
import type { Kysely, Selectable } from 'kysely';
import { KYSELY_DB } from '../../database/database.provider.js';
import type { UserAccountStore } from '../ports/auth-ports.js';
import { UserAccount } from '../domain/user-account.js';
import { AuthPortError } from '../ports/auth-port-error.js';

@Injectable()
export class KyselyUserAccountStore implements UserAccountStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async count(): Promise<number> {
    try {
      const row = await this.db
        .selectFrom('users')
        .select((builder) => builder.fn.countAll<number>().as('count'))
        .executeTakeFirstOrThrow();

      return Number(row.count);
    } catch (error) {
      throw new AuthPortError({
        reason: 'user-account-store-failed',
        params: { operation: 'count' },
        cause: error,
      });
    }
  }

  async findById(id: string): Promise<UserAccount | null> {
    try {
      const row = await this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
      return row ? toUserAccount(row) : null;
    } catch (error) {
      throw new AuthPortError({
        reason: 'user-account-store-failed',
        params: { operation: 'findById' },
        cause: error,
      });
    }
  }

  async findByUsername(username: string): Promise<UserAccount | null> {
    try {
      const row = await this.db
        .selectFrom('users')
        .selectAll()
        .where('username', '=', username)
        .executeTakeFirst();

      return row ? toUserAccount(row) : null;
    } catch (error) {
      throw new AuthPortError({
        reason: 'user-account-store-failed',
        params: { operation: 'findByUsername' },
        cause: error,
      });
    }
  }

  async save(user: UserAccount): Promise<void> {
    try {
      const snapshot = user.toSnapshot();

      await this.db
        .insertInto('users')
        .values({
          id: snapshot.id,
          username: snapshot.username,
          password_hash: snapshot.passwordHash,
          display_name: snapshot.displayName,
          role: snapshot.role,
          created_at: snapshot.createdAt,
          updated_at: snapshot.updatedAt,
        })
        .execute();
    } catch (error) {
      throw new AuthPortError({
        reason: 'user-account-store-failed',
        params: { operation: 'save' },
        cause: error,
      });
    }
  }
}

type UserRow = Selectable<UsersTable>;

function toUserAccount(row: UserRow): UserAccount {
  return UserAccount.restore({
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
