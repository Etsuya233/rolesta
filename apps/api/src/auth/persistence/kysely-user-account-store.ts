import { Inject, Injectable } from '@nestjs/common';
import type { Database, UsersTable } from '@rolesta/db';
import type { Kysely, Selectable } from 'kysely';
import { KYSELY_DB } from '../../database/database.provider.js';
import type { UserAccountStore } from '../ports/auth-ports.js';
import { UserAccount } from '../domain/user-account.js';

@Injectable()
export class KyselyUserAccountStore implements UserAccountStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async count(): Promise<number> {
    const row = await this.db
      .selectFrom('users')
      .select((builder) => builder.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    return Number(row.count);
  }

  async findById(id: string): Promise<UserAccount | null> {
    const row = await this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? toUserAccount(row) : null;
  }

  async findByUsername(username: string): Promise<UserAccount | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();

    return row ? toUserAccount(row) : null;
  }

  async save(user: UserAccount): Promise<void> {
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
