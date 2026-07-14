import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../../packages/db/src/test-utils/create-test-database.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import { KyselyUnitOfWork } from '../../database/kysely-unit-of-work.js';
import { createEmptyCharacterCardDraft } from '../domain/character-card.js';
import { KyselyCharacterAvatarAssignment } from './kysely-character-avatar-assignment.js';
import { KyselyCharacterCardStore } from './kysely-character-card-store.js';

describe('KyselyCharacterAvatarAssignment', () => {
  it('updates only the character reference and returns the previous resource', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);
    const assignment = new KyselyCharacterAvatarAssignment(context);
    const cards = new KyselyCharacterCardStore(context);

    try {
      await seedUser(database.db, 'owner');
      await seedResource(database.db, {
        id: 'old_avatar',
        ownerUserId: 'owner',
        purpose: 'character-avatar',
        status: 'active',
      });
      await seedResource(database.db, {
        id: 'new_avatar',
        ownerUserId: 'owner',
        purpose: 'character-avatar',
        status: 'pending',
      });
      await cards.save({
        ...createEmptyCharacterCardDraft({
          id: 'card',
          ownerUserId: 'owner',
          nowMs: 1,
        }),
        avatarResourceId: 'old_avatar',
      });

      const updated = await unitOfWork.run(() =>
        assignment.replace({
          characterId: 'card',
          ownerUserId: 'owner',
          resourceId: 'new_avatar',
          nowMs: 200,
        }),
      );

      expect(updated).toMatchObject({
        previousResourceId: 'old_avatar',
        character: {
          avatarResourceId: 'new_avatar',
          updatedAtMs: 200,
        },
      });
      await expect(resourceState(database.db, 'new_avatar')).resolves.toEqual({
        status: 'pending',
        orphaned_at_ms: null,
      });
      await expect(resourceState(database.db, 'old_avatar')).resolves.toEqual({
        status: 'active',
        orphaned_at_ms: null,
      });

      const removed = await unitOfWork.run(() =>
        assignment.remove({
          characterId: 'card',
          ownerUserId: 'owner',
          nowMs: 300,
        }),
      );

      expect(removed).toMatchObject({
        previousResourceId: 'new_avatar',
        character: {
          avatarResourceId: null,
          updatedAtMs: 300,
        },
      });
      await expect(resourceState(database.db, 'new_avatar')).resolves.toEqual({
        status: 'pending',
        orphaned_at_ms: null,
      });
    } finally {
      await database.destroy();
    }
  });

  it('does not inspect file lifecycle fields owned by the files module', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);
    const assignment = new KyselyCharacterAvatarAssignment(context);
    const cards = new KyselyCharacterCardStore(context);

    try {
      await seedUser(database.db, 'owner');
      await seedResource(database.db, {
        id: 'candidate',
        ownerUserId: 'owner',
        purpose: 'user-avatar',
        status: 'pending',
      });
      await cards.save(
        createEmptyCharacterCardDraft({
          id: 'card',
          ownerUserId: 'owner',
          nowMs: 1,
        }),
      );

      await expect(
        unitOfWork.run(() =>
          assignment.replace({
            characterId: 'card',
            ownerUserId: 'owner',
            resourceId: 'candidate',
            nowMs: 200,
          }),
        ),
      ).resolves.toMatchObject({
        previousResourceId: null,
        character: { avatarResourceId: 'candidate', updatedAtMs: 200 },
      });

      await expect(cards.findOwnedById('card', 'owner')).resolves.toMatchObject({
        avatarResourceId: 'candidate',
        updatedAtMs: 200,
      });
      await expect(resourceState(database.db, 'candidate')).resolves.toEqual({
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

async function resourceState(db: TestDatabase, id: string) {
  return db
    .selectFrom('file_resources')
    .select(['status', 'orphaned_at_ms'])
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}
