import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../../packages/db/src/test-utils/create-test-database.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import { KyselyUnitOfWork } from '../../database/kysely-unit-of-work.js';
import type { Worldbook } from '../domain/worldbook.js';
import { KyselyWorldbookStore } from './kysely-worldbook-store.js';

describe('KyselyWorldbookStore', () => {
  it('filters visible worldbooks by permission scope', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);
    const store = new KyselyWorldbookStore(context);

    try {
      await seedUser(database.db, 'owner');
      await seedUser(database.db, 'other');
      await unitOfWork.run(async () => {
        await store.save(
          worldbook({
            id: 'mine',
            ownerUserId: 'owner',
            visibility: 'private',
          }),
        );
        await store.save(
          worldbook({
            id: 'public',
            ownerUserId: 'other',
            visibility: 'public',
          }),
        );
        await store.save(
          worldbook({
            id: 'hidden',
            ownerUserId: 'other',
            visibility: 'private',
          }),
        );
      });

      await expect(listIds(store, 'all')).resolves.toEqual(['mine', 'public']);
      await expect(listIds(store, 'mine')).resolves.toEqual(['mine']);
      await expect(listIds(store, 'public')).resolves.toEqual(['public']);
    } finally {
      await database.destroy();
    }
  });
});

async function listIds(
  store: KyselyWorldbookStore,
  scope: 'all' | 'mine' | 'public',
): Promise<string[]> {
  const page = await store.list({
    viewerUserId: 'owner',
    scope,
    sort: 'name',
    direction: 'asc',
    pageIndex: 0,
    pageSize: 20,
    q: '',
  });
  return page.items.map((item) => item.id).sort();
}

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

function worldbook(overrides: Partial<Worldbook>): Worldbook {
  return {
    id: overrides.id ?? 'worldbook',
    ownerUserId: overrides.ownerUserId ?? 'owner',
    visibility: overrides.visibility ?? 'private',
    name: overrides.name ?? overrides.id ?? 'Worldbook',
    description: '',
    tags: [],
    scanDepth: 3,
    tokenBudget: 1024,
    recursiveScan: false,
    entries: [],
    sourceFormat: 'rolesta',
    sourceSnapshot: {},
    createdAtMs: 1783090000000,
    updatedAtMs: 1783090000000,
    lastUsedAtMs: null,
    usageCount: 0,
    ...overrides,
  };
}
