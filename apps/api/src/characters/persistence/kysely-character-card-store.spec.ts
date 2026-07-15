import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../../packages/db/src/test-utils/create-test-database.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import { createEmptyCharacterCardDraft, type CharacterCard } from '../domain/character-card.js';
import { KyselyCharacterCardStore } from './kysely-character-card-store.js';

describe('KyselyCharacterCardStore', () => {
  it('finds private cards only for owners and public cards for other viewers', async () => {
    const database = await createTestDatabase();
    const store = new KyselyCharacterCardStore(new KyselyDatabaseContext(database.db));

    try {
      await seedUser(database.db, 'owner');
      await seedUser(database.db, 'reader');

      await store.save(
        characterCard({
          id: 'private_card',
          ownerUserId: 'owner',
          visibility: 'private',
        }),
      );
      await store.save(
        characterCard({
          id: 'public_card',
          ownerUserId: 'owner',
          visibility: 'public',
        }),
      );

      await expect(store.findVisibleById('private_card', 'owner')).resolves.toMatchObject({
        id: 'private_card',
      });
      await expect(store.findVisibleById('private_card', 'reader')).resolves.toBeNull();
      await expect(store.findVisibleById('public_card', 'reader')).resolves.toMatchObject({
        id: 'public_card',
      });
      await expect(store.findOwnedById('public_card', 'reader')).resolves.toBeNull();
    } finally {
      await database.destroy();
    }
  });

  it('lists all visible cards with stable offset pagination', async () => {
    const database = await createTestDatabase();
    const store = new KyselyCharacterCardStore(new KyselyDatabaseContext(database.db));

    try {
      await seedUser(database.db, 'owner');
      await seedUser(database.db, 'other');

      await store.save(
        characterCard({
          id: 'b',
          ownerUserId: 'owner',
          name: 'Beta',
          visibility: 'private',
        }),
      );
      await store.save(
        characterCard({
          id: 'a',
          ownerUserId: 'other',
          name: 'Alpha',
          visibility: 'public',
        }),
      );
      await store.save(
        characterCard({
          id: 'c',
          ownerUserId: 'other',
          name: 'Gamma',
          visibility: 'private',
        }),
      );

      const page = await store.list({
        viewerUserId: 'owner',
        scope: 'all',
        sort: 'name',
        direction: 'asc',
        pageIndex: 0,
        pageSize: 10,
        q: '',
      });

      expect(page).toMatchObject({
        pageIndex: 0,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
      });
      expect(page.items.map((item) => item.name)).toEqual(['Alpha', 'Beta']);
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

function characterCard(overrides: Partial<CharacterCard>): CharacterCard {
  return {
    ...createEmptyCharacterCardDraft({
      id: overrides.id ?? 'card',
      ownerUserId: overrides.ownerUserId ?? 'owner',
      nowMs: 1783090000000,
    }),
    name: overrides.name ?? 'Card',
    firstMessage: 'Hello',
    visibility: overrides.visibility ?? 'private',
    tags: overrides.tags ?? [],
    comment: overrides.comment ?? '',
    ...overrides,
  };
}
