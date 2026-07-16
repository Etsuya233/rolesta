import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../../packages/db/src/test-utils/create-test-database.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import { DEFAULT_WORLDBOOK_SCAN_PREFERENCES } from '../domain/worldbook-scan-preferences.js';
import { KyselyWorldbookScanPreferencesStore } from './kysely-worldbook-scan-preferences-store.js';

describe('KyselyWorldbookScanPreferencesStore', () => {
  it('returns domain defaults and persists a complete user preference snapshot', async () => {
    const database = await createTestDatabase();
    const store = new KyselyWorldbookScanPreferencesStore(new KyselyDatabaseContext(database.db));

    try {
      await seedUser(database.db, 'owner');
      await expect(store.get('owner')).resolves.toEqual(DEFAULT_WORLDBOOK_SCAN_PREFERENCES);

      const updated = {
        ...DEFAULT_WORLDBOOK_SCAN_PREFERENCES,
        scanDepth: 8,
        budgetPercent: 40,
        recursive: true,
        characterLoreInsertionStrategy: 'globalFirst' as const,
      };
      await store.save('owner', updated);
      await expect(store.get('owner')).resolves.toEqual(updated);
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
