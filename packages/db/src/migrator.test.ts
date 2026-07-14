import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sql } from 'kysely';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDatabaseConfig } from './config/database-config.js';
import { createMigrationProvider } from './migrations/index.js';
import { createTestDatabase } from './test-utils/create-test-database.js';
import * as assetDefaultsDomainEventsMigration from './migrations/0013_asset_defaults_domain_events.js';

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

  it('creates the characters table with portable columns', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const tables = await sql<{ name: string }>`select name from sqlite_master where type = 'table'`
      .execute(database.db)
      .then((result) => result.rows.map((row) => row.name));
    const columns = await sql<{ name: string }>`pragma table_info(characters)`
      .execute(database.db)
      .then((result) => result.rows.map((row) => row.name));

    expect(tables).toContain('characters');
    expect(columns).toEqual(expect.arrayContaining(['created_at_ms', 'updated_at_ms', 'visibility', 'source_format']));
  });

  it('adds private-by-default visibility to presets', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const columns = await sql<{ dflt_value: string | null; name: string }>`pragma table_info(presets)`
      .execute(database.db)
      .then((result) => result.rows);
    const visibility = columns.find((column) => column.name === 'visibility');

    expect(visibility).toMatchObject({ dflt_value: "'private'" });
  });

  it('creates asset defaults with nullable references and only user ownership enforced', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const columns = await sql<{ name: string; notnull: number; pk: number }>`pragma table_info(asset_defaults)`
      .execute(database.db)
      .then((result) => result.rows);
    const foreignKeys = await sql<{
      from: string;
      on_delete: string;
      table: string;
    }>`pragma foreign_key_list(asset_defaults)`
      .execute(database.db)
      .then((result) => result.rows);

    expect(columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'user_id', pk: 1 }),
        expect.objectContaining({ name: 'persona_character_id', notnull: 0 }),
        expect.objectContaining({ name: 'preset_id', notnull: 0 }),
        expect.objectContaining({ name: 'model_provider_id', notnull: 0 }),
      ]),
    );
    expect(foreignKeys).toEqual([
      expect.objectContaining({ from: 'user_id', table: 'users', on_delete: 'CASCADE' }),
    ]);
  });

  it('preserves asset defaults while removing asset foreign keys', async () => {
    const database = await createTestDatabase();
    databases.push(database);
    await assetDefaultsDomainEventsMigration.down(database.db);
    await database.db
      .insertInto('users')
      .values({
        id: 'user_1',
        username: 'owner',
        password_hash: 'hash',
        display_name: 'Owner',
        role: 'user',
        created_at: '2026-07-14T00:00:00.000Z',
        updated_at: '2026-07-14T00:00:00.000Z',
      })
      .execute();
    await sql`pragma foreign_keys = off`.execute(database.db);
    await database.db
      .insertInto('asset_defaults')
      .values({
        user_id: 'user_1',
        persona_character_id: 'character_1',
        preset_id: 'preset_1',
        model_provider_id: 'provider_1',
      })
      .execute();

    await assetDefaultsDomainEventsMigration.up(database.db);
    await sql`pragma foreign_keys = on`.execute(database.db);

    await expect(
      database.db
        .selectFrom('asset_defaults')
        .selectAll()
        .where('user_id', '=', 'user_1')
        .executeTakeFirst(),
    ).resolves.toEqual({
      user_id: 'user_1',
      persona_character_id: 'character_1',
      preset_id: 'preset_1',
      model_provider_id: 'provider_1',
    });

    await database.db.deleteFrom('users').where('id', '=', 'user_1').execute();
    await expect(
      database.db.selectFrom('asset_defaults').selectAll().execute(),
    ).resolves.toEqual([]);
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

  it('returns every migration file for dialects without overrides', async () => {
    const migrations = await createMigrationProvider('mysql').getMigrations();
    const expectedMigrationNames = readdirSync(fileURLToPath(new URL('./migrations/', import.meta.url)))
      .filter((fileName) => /^\d{4}_.+\.ts$/.test(fileName))
      .map((fileName) => fileName.replace(/\.ts$/, ''))
      .sort();

    expect(Object.keys(migrations).sort()).toEqual(expectedMigrationNames);
  });
});
