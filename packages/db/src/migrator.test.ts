import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

  it('creates asset defaults with nullable asset references and deletion actions', async () => {
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
    expect(foreignKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'user_id', table: 'users', on_delete: 'CASCADE' }),
        expect.objectContaining({
          from: 'persona_character_id',
          table: 'characters',
          on_delete: 'SET NULL',
        }),
        expect.objectContaining({ from: 'preset_id', table: 'presets', on_delete: 'SET NULL' }),
        expect.objectContaining({
          from: 'model_provider_id',
          table: 'model_provider_configs',
          on_delete: 'SET NULL',
        }),
      ]),
    );
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
