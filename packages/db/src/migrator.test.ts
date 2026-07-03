import { sql } from 'kysely';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDatabaseConfig } from './config/database-config.js';
import { createMigrationProvider } from './migrations/index.js';
import { createTestDatabase } from './test-utils/create-test-database.js';

describe('database migrations', () => {
  const databases: Array<Awaited<ReturnType<typeof createTestDatabase>>> = [];

  afterEach(async () => {
    await Promise.all(databases.map((database) => database.destroy()));
    databases.length = 0;
  });

  it('creates the users table with portable columns', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const rows = await sql<{ name: string }>`select name from sqlite_master where type = 'table'`
      .execute(database.db)
      .then((result) => result.rows.map((row) => row.name));

    expect(rows).toContain('users');
  });

  it('loads sqlite configuration by default', () => {
    expect(loadDatabaseConfig({})).toEqual({
      dialect: 'sqlite',
      databasePath: '.data/rolesta.sqlite',
    });
  });

  it('loads connection string configuration for server databases', () => {
    expect(
      loadDatabaseConfig({
        DATABASE_DIALECT: 'postgres',
        DATABASE_URL: 'postgres://rolesta:secret@localhost:5432/rolesta',
      }),
    ).toEqual({
      dialect: 'postgres',
      connectionString: 'postgres://rolesta:secret@localhost:5432/rolesta',
    });
  });

  it('rejects unsupported database dialects', () => {
    expect(() => loadDatabaseConfig({ DATABASE_DIALECT: 'oracle' })).toThrow(
      'Unsupported database dialect "oracle".',
    );
  });

  it('returns the common migration set for dialects without overrides', async () => {
    const migrations = await createMigrationProvider('mysql').getMigrations();

    expect(Object.keys(migrations)).toEqual(['0001_initial', '0002_username_accounts']);
  });
});
