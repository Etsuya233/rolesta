import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sql } from 'kysely';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDatabaseConfig } from './config/database-config.js';
import { createMigrationProvider } from './migrations/index.js';
import { createTestDatabase } from './test-utils/create-test-database.js';
import * as assetDefaultsDomainEventsMigration from './migrations/0013_asset_defaults_domain_events.js';
import * as presetPromptModelMigration from './migrations/0015_preset_prompt_model.js';

describe('database migrations', () => {
  const databases: Array<Awaited<ReturnType<typeof createTestDatabase>>> = [];

  afterEach(async () => {
    await Promise.all(databases.map((database) => database.destroy()));
    databases.length = 0;
  });

  it('creates the users table with portable columns', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const rows = await sql<{
      name: string;
    }>`select name from sqlite_master where type = 'table'`
      .execute(database.db)
      .then((result) => result.rows.map((row) => row.name));

    expect(rows).toContain('users');
  });

  it('creates the characters table with portable columns', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const tables = await sql<{
      name: string;
    }>`select name from sqlite_master where type = 'table'`
      .execute(database.db)
      .then((result) => result.rows.map((row) => row.name));
    const columns = await sql<{ name: string }>`pragma table_info(characters)`
      .execute(database.db)
      .then((result) => result.rows.map((row) => row.name));

    expect(tables).toContain('characters');
    expect(columns).toEqual(
      expect.arrayContaining(['created_at_ms', 'updated_at_ms', 'visibility', 'source_format']),
    );
  });

  it('adds private-by-default visibility to presets', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const columns = await sql<{
      dflt_value: string | null;
      name: string;
    }>`pragma table_info(presets)`
      .execute(database.db)
      .then((result) => result.rows);
    const visibility = columns.find((column) => column.name === 'visibility');

    expect(visibility).toMatchObject({ dflt_value: "'private'" });
  });

  it('creates asset defaults with nullable references and only user ownership enforced', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const columns = await sql<{
      name: string;
      notnull: number;
      pk: number;
    }>`pragma table_info(asset_defaults)`
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
      expect.objectContaining({
        from: 'user_id',
        table: 'users',
        on_delete: 'CASCADE',
      }),
    ]);
  });

  it('creates chats with nullable asset references and the required indexes', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const columns = await sql<{
      name: string;
      notnull: number;
    }>`pragma table_info(chats)`
      .execute(database.db)
      .then((result) => result.rows);
    const foreignKeys = await sql<{
      from: string;
      on_delete: string;
      table: string;
    }>`pragma foreign_key_list(chats)`
      .execute(database.db)
      .then((result) => result.rows);
    const indexes = await sql<{ name: string }>`pragma index_list(chats)`
      .execute(database.db)
      .then((result) => result.rows.map((row) => row.name));

    expect(columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'title', notnull: 1 }),
        expect.objectContaining({ name: 'chat_character_id', notnull: 0 }),
        expect.objectContaining({ name: 'persona_character_id', notnull: 0 }),
        expect.objectContaining({ name: 'preset_id', notnull: 0 }),
        expect.objectContaining({ name: 'model_provider_id', notnull: 0 }),
      ]),
    );
    expect(foreignKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'owner_user_id',
          table: 'users',
          on_delete: 'CASCADE',
        }),
        expect.objectContaining({
          from: 'chat_character_id',
          table: 'characters',
          on_delete: 'SET NULL',
        }),
        expect.objectContaining({
          from: 'persona_character_id',
          table: 'characters',
          on_delete: 'SET NULL',
        }),
        expect.objectContaining({
          from: 'preset_id',
          table: 'presets',
          on_delete: 'SET NULL',
        }),
        expect.objectContaining({
          from: 'model_provider_id',
          table: 'model_provider_configs',
          on_delete: 'SET NULL',
        }),
      ]),
    );
    expect(indexes).toEqual(
      expect.arrayContaining([
        'chats_owner_updated_id_idx',
        'chats_owner_created_id_idx',
        'chats_owner_title_id_idx',
        'chats_owner_character_idx',
      ]),
    );
  });

  it('migrates legacy preset entries into typed prompt items without losing duplicates', async () => {
    const database = await createTestDatabase();
    databases.push(database);
    await presetPromptModelMigration.down(database.db);
    await database.db
      .insertInto('users')
      .values({
        id: 'user_1',
        username: 'owner',
        password_hash: 'hash',
        display_name: 'Owner',
        role: 'user',
        created_at: '2026-07-16T00:00:00.000Z',
        updated_at: '2026-07-16T00:00:00.000Z',
      })
      .execute();
    await database.db
      .insertInto('presets')
      .values({
        id: 'preset_1',
        owner_user_id: 'user_1',
        visibility: 'private',
        name: 'Legacy',
        model_provider_id: null,
        model_settings_json: '{"stream":true}',
        tokenizer: 'cl100k_base',
        source_format: 'sillytavern_preset',
        source_snapshot_json: '{}',
        created_at_ms: 1,
        updated_at_ms: 1,
        last_used_at_ms: null,
        usage_count: 0,
      })
      .execute();
    await sql`
      insert into preset_entries (
        id, preset_id, identifier, name, role, position, content, token_count,
        metadata_json, created_at_ms, updated_at_ms
      ) values
        ('main_1', 'preset_1', 'main', 'Main', 'system', 'system', 'primary', 2,
         '{"system_prompt":true,"forbid_overrides":true}', 1, 1),
        ('main_2', 'preset_1', 'main', 'Duplicate Main', 'assistant', 'postHistory',
         'duplicate', 3, '{"system_prompt":true}', 2, 2),
        ('custom_1', 'preset_1', 'custom', 'Custom', 'user', 'preHistory', 'custom', 4,
         '{"system_prompt":false,"injection_depth":7,"injection_order":90}', 3, 3)
    `.execute(database.db);
    await sql`
      insert into preset_prompt_items (preset_id, entry_id, enabled, order_index) values
        ('preset_1', 'main_1', 1, 0),
        ('preset_1', 'main_2', 1, 1),
        ('preset_1', 'custom_1', 0, 2)
    `.execute(database.db);

    await presetPromptModelMigration.up(database.db);

    const entries = await sql<{
      id: string;
      identifier: string;
      placement_kind: string;
      in_chat_depth: number | null;
    }>`select id, identifier, placement_kind, in_chat_depth from preset_entries order by id`.execute(
      database.db,
    );
    const items = await sql<{
      kind: string;
      system_prompt_key: string | null;
      entry_id: string | null;
      enabled: number;
      order_index: number;
      allow_character_override: number | null;
    }>`
      select kind, system_prompt_key, entry_id, enabled, order_index, allow_character_override
      from preset_prompt_items
      order by order_index
    `.execute(database.db);

    expect(entries.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'main_2', identifier: 'main-custom-1' }),
        expect.objectContaining({
          id: 'custom_1',
          identifier: 'custom',
          placement_kind: 'inChat',
          in_chat_depth: 7,
        }),
      ]),
    );
    expect(items.rows).toHaveLength(14);
    expect(items.rows[0]).toMatchObject({
      kind: 'systemPrompt',
      system_prompt_key: 'mainPrompt',
      enabled: 1,
      order_index: 0,
      allow_character_override: 0,
    });
    expect(items.rows[1]).toMatchObject({ kind: 'customPrompt', entry_id: 'main_2' });
    expect(items.rows.slice(3).every((item) => item.enabled === 0)).toBe(true);
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
    await expect(database.db.selectFrom('asset_defaults').selectAll().execute()).resolves.toEqual(
      [],
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
    const expectedMigrationNames = readdirSync(
      fileURLToPath(new URL('./migrations/', import.meta.url)),
    )
      .filter((fileName) => /^\d{4}_.+\.ts$/.test(fileName))
      .map((fileName) => fileName.replace(/\.ts$/, ''))
      .sort();

    expect(Object.keys(migrations).sort()).toEqual(expectedMigrationNames);
  });
});
