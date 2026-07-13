import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../../packages/db/src/test-utils/create-test-database.js';
import { KyselyUserAvatarAssignment } from './kysely-user-avatar-assignment.js';

describe('KyselyUserAvatarAssignment', () => {
  it('atomically activates the new avatar and orphans the previous avatar', async () => {
    const database = await createTestDatabase();
    const assignment = new KyselyUserAvatarAssignment(database.db);

    try {
      await seedUser(database.db, 'owner');
      await seedResource(database.db, {
        id: 'old_avatar',
        ownerUserId: 'owner',
        purpose: 'user-avatar',
        status: 'active',
      });
      await seedResource(database.db, {
        id: 'new_avatar',
        ownerUserId: 'owner',
        purpose: 'user-avatar',
        status: 'pending',
      });
      await database.db
        .updateTable('users')
        .set({ avatar_resource_id: 'old_avatar' })
        .where('id', '=', 'owner')
        .execute();

      await expect(
        assignment.replace({
          userId: 'owner',
          resourceId: 'new_avatar',
          nowMs: 200,
        }),
      ).resolves.toBe(true);

      await expect(userAvatar(database.db, 'owner')).resolves.toBe('new_avatar');
      await expect(resourceState(database.db, 'new_avatar')).resolves.toEqual({
        status: 'active',
        orphaned_at_ms: null,
      });
      await expect(resourceState(database.db, 'old_avatar')).resolves.toEqual({
        status: 'orphaned',
        orphaned_at_ms: 200,
      });

      await expect(assignment.remove({ userId: 'owner', nowMs: 300 })).resolves.toBe(true);
      await expect(userAvatar(database.db, 'owner')).resolves.toBeNull();
      await expect(resourceState(database.db, 'new_avatar')).resolves.toEqual({
        status: 'orphaned',
        orphaned_at_ms: 300,
      });
    } finally {
      await database.destroy();
    }
  });

  it('rolls back activation when the previous resource violates avatar invariants', async () => {
    const database = await createTestDatabase();
    const assignment = new KyselyUserAvatarAssignment(database.db);

    try {
      await seedUser(database.db, 'owner');
      await seedResource(database.db, {
        id: 'invalid_old_avatar',
        ownerUserId: 'owner',
        purpose: 'character-avatar',
        status: 'active',
      });
      await seedResource(database.db, {
        id: 'new_avatar',
        ownerUserId: 'owner',
        purpose: 'user-avatar',
        status: 'pending',
      });
      await database.db
        .updateTable('users')
        .set({ avatar_resource_id: 'invalid_old_avatar' })
        .where('id', '=', 'owner')
        .execute();

      await expect(
        assignment.replace({
          userId: 'owner',
          resourceId: 'new_avatar',
          nowMs: 200,
        }),
      ).rejects.toMatchObject({
        reason: 'avatar-assignment-conflict',
      });

      await expect(userAvatar(database.db, 'owner')).resolves.toBe('invalid_old_avatar');
      await expect(resourceState(database.db, 'new_avatar')).resolves.toEqual({
        status: 'pending',
        orphaned_at_ms: null,
      });
    } finally {
      await database.destroy();
    }
  });
});

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>['db'];

async function seedUser(db: TestDatabase, id: string): Promise<void> {
  await db
    .insertInto('users')
    .values({
      id,
      username: id,
      password_hash: 'unused',
      display_name: id,
      role: 'user',
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    })
    .execute();
}

async function seedResource(
  db: TestDatabase,
  input: {
    id: string;
    ownerUserId: string;
    purpose: string;
    status: 'pending' | 'active' | 'orphaned';
  },
): Promise<void> {
  await db
    .insertInto('file_resources')
    .values({
      id: input.id,
      owner_user_id: input.ownerUserId,
      purpose: input.purpose,
      status: input.status,
      orphaned_at_ms: null,
      created_at_ms: 1,
    })
    .execute();
}

async function userAvatar(db: TestDatabase, userId: string): Promise<string | null> {
  const user = await db
    .selectFrom('users')
    .select('avatar_resource_id')
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();
  return user.avatar_resource_id;
}

async function resourceState(db: TestDatabase, id: string) {
  return db
    .selectFrom('file_resources')
    .select(['status', 'orphaned_at_ms'])
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}
