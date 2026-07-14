import { createTestDatabase } from '../../../../packages/db/src/test-utils/create-test-database.js';
import { describe, expect, it } from 'vitest';
import { Session } from '../auth/domain/session.js';
import { UserAccount } from '../auth/domain/user-account.js';
import { KyselySessionStore } from '../auth/persistence/kysely-session-store.js';
import { KyselyUserAccountStore } from '../auth/persistence/kysely-user-account-store.js';
import { KyselyDatabaseContext } from './kysely-database-context.js';
import { KyselyUnitOfWork } from './kysely-unit-of-work.js';

describe('KyselyUnitOfWork', () => {
  it('commits a successful operation and restores the root database', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);

    try {
      await unitOfWork.run(async () => {
        expect(context.database).not.toBe(database.db);
        await insertUser(context, 'committed');
      });

      expect(context.database).toBe(database.db);
      await expect(findUser(database.db, 'committed')).resolves.toBeDefined();
    } finally {
      await database.destroy();
    }
  });

  it('rolls back all writes when the operation fails', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);

    try {
      await expect(
        unitOfWork.run(async () => {
          await insertUser(context, 'rolled-back');
          throw new Error('stop transaction');
        }),
      ).rejects.toThrow('stop transaction');

      expect(context.database).toBe(database.db);
      await expect(
        findUser(database.db, 'rolled-back'),
      ).resolves.toBeUndefined();
    } finally {
      await database.destroy();
    }
  });

  it('rolls back the first store when a second store fails', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);
    const users = new KyselyUserAccountStore(context);
    const sessions = new KyselySessionStore(context);
    const now = '2026-07-14T00:00:00.000Z';

    try {
      await insertUser(context, 'existing');
      await context.database
        .insertInto('sessions')
        .values({
          id: 'duplicate-token',
          user_id: 'existing',
          created_at: now,
          expires_at: '2026-07-15T00:00:00.000Z',
        })
        .execute();

      await expect(
        unitOfWork.run(async () => {
          await users.save(
            UserAccount.createAdmin({
              id: 'new-admin',
              username: 'new-admin',
              passwordHash: 'hash',
              now,
            }),
          );
          await sessions.save(
            Session.create({
              tokenHash: 'duplicate-token',
              userId: 'new-admin',
              createdAt: now,
              expiresAt: '2026-07-15T00:00:00.000Z',
            }),
          );
        }),
      ).rejects.toBeDefined();

      await expect(findUser(database.db, 'new-admin')).resolves.toBeUndefined();
    } finally {
      await database.destroy();
    }
  });

  it('joins nested operations to the active transaction', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);

    try {
      await expect(
        unitOfWork.run(async () => {
          const outerDatabase = context.database;
          await insertUser(context, 'outer');

          await unitOfWork.run(async () => {
            expect(context.database).toBe(outerDatabase);
            await insertUser(context, 'inner');
          });

          throw new Error('rollback outer transaction');
        }),
      ).rejects.toThrow('rollback outer transaction');

      await expect(findUser(database.db, 'outer')).resolves.toBeUndefined();
      await expect(findUser(database.db, 'inner')).resolves.toBeUndefined();
    } finally {
      await database.destroy();
    }
  });
});

async function insertUser(
  context: KyselyDatabaseContext,
  id: string,
): Promise<void> {
  const now = new Date().toISOString();
  await context.database
    .insertInto('users')
    .values({
      id,
      username: id,
      password_hash: 'hash',
      display_name: id,
      avatar_resource_id: null,
      role: 'user',
      created_at: now,
      updated_at: now,
    })
    .execute();
}

function findUser(database: KyselyDatabaseContext['database'], id: string) {
  return database
    .selectFrom('users')
    .select('id')
    .where('id', '=', id)
    .executeTakeFirst();
}
