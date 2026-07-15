import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../../packages/db/src/test-utils/create-test-database.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import { AssetDefaultsPortError } from '../ports/asset-defaults-port-error.js';
import { KyselyAssetDefaultsStore } from './kysely-asset-defaults-store.js';
import { KyselyChatAssetOwnership } from './kysely-chat-asset-ownership.js';

describe('Kysely asset defaults persistence', () => {
  it('upserts only submitted fields and returns the complete row', async () => {
    const database = await createTestDatabase();
    const store = new KyselyAssetDefaultsStore(new KyselyDatabaseContext(database.db));

    try {
      await seedUser(database.db, 'owner');
      await seedAssets(database.db, 'owner');

      await expect(store.get('owner')).resolves.toEqual(emptyDefaults);
      await expect(store.update('owner', { personaCharacterId: 'character' })).resolves.toEqual({
        ...emptyDefaults,
        personaCharacterId: 'character',
      });
      await expect(store.update('owner', { presetId: 'preset' })).resolves.toEqual({
        ...emptyDefaults,
        personaCharacterId: 'character',
        presetId: 'preset',
      });
      await expect(store.update('owner', { personaCharacterId: null })).resolves.toEqual({
        ...emptyDefaults,
        presetId: 'preset',
      });
    } finally {
      await database.destroy();
    }
  });

  it('does not lose different fields updated concurrently and commits the last same-field value', async () => {
    const database = await createTestDatabase();
    const store = new KyselyAssetDefaultsStore(new KyselyDatabaseContext(database.db));

    try {
      await seedUser(database.db, 'owner');
      await seedAssets(database.db, 'owner');

      await Promise.all([
        store.update('owner', { personaCharacterId: 'character' }),
        store.update('owner', { presetId: 'preset' }),
        store.update('owner', { modelProviderId: 'provider' }),
      ]);
      await expect(store.get('owner')).resolves.toEqual({
        personaCharacterId: 'character',
        presetId: 'preset',
        modelProviderId: 'provider',
      });

      await store.update('owner', { presetId: null });
      await expect(store.update('owner', { presetId: 'preset' })).resolves.toMatchObject({
        presetId: 'preset',
      });
    } finally {
      await database.destroy();
    }
  });

  it('conditionally clears deleted asset references and cascades with the user', async () => {
    const database = await createTestDatabase();
    const store = new KyselyAssetDefaultsStore(new KyselyDatabaseContext(database.db));

    try {
      await seedUser(database.db, 'owner');
      await seedAssets(database.db, 'owner');
      await store.update('owner', {
        personaCharacterId: 'character',
        presetId: 'preset',
        modelProviderId: 'provider',
      });

      await database.db.deleteFrom('characters').where('id', '=', 'character').execute();
      await database.db.deleteFrom('presets').where('id', '=', 'preset').execute();
      await database.db.deleteFrom('model_provider_configs').where('id', '=', 'provider').execute();
      await expect(store.get('owner')).resolves.toEqual({
        personaCharacterId: 'character',
        presetId: 'preset',
        modelProviderId: 'provider',
      });

      await store.clearPersonaCharacter('owner', 'other-character');
      await store.clearPreset('owner', 'other-preset');
      await store.clearModelProvider('owner', 'other-provider');
      await expect(store.get('owner')).resolves.toEqual({
        personaCharacterId: 'character',
        presetId: 'preset',
        modelProviderId: 'provider',
      });

      await store.clearPersonaCharacter('owner', 'character');
      await store.clearPreset('owner', 'preset');
      await store.clearModelProvider('owner', 'provider');
      await expect(store.get('owner')).resolves.toEqual(emptyDefaults);

      await database.db.deleteFrom('users').where('id', '=', 'owner').execute();
      await expect(database.db.selectFrom('asset_defaults').selectAll().execute()).resolves.toEqual(
        [],
      );
    } finally {
      await database.destroy();
    }
  });

  it('checks ownership for every submitted non-null field including public foreign assets', async () => {
    const database = await createTestDatabase();
    const ownership = new KyselyChatAssetOwnership(new KyselyDatabaseContext(database.db));

    try {
      await seedUser(database.db, 'owner');
      await seedUser(database.db, 'other');
      await seedAssets(database.db, 'other', 'other-');

      await expect(
        ownership.findUnavailableFields('owner', {
          personaCharacterId: 'other-character',
          presetId: 'other-preset',
          modelProviderId: 'other-provider',
        }),
      ).resolves.toEqual(['personaCharacterId', 'presetId', 'modelProviderId']);
      await expect(
        ownership.findUnavailableFields('owner', {
          personaCharacterId: null,
        }),
      ).resolves.toEqual([]);
    } finally {
      await database.destroy();
    }
  });

  it('translates a missing owner during upsert into a conflict', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const store = new KyselyAssetDefaultsStore(context);

    try {
      await seedUser(database.db, 'owner');
      await seedAssets(database.db, 'owner');
      await database.db.deleteFrom('users').where('id', '=', 'owner').execute();

      await expect(
        store.update('owner', { personaCharacterId: 'character' }),
      ).rejects.toMatchObject({
        name: AssetDefaultsPortError.name,
        reason: 'asset-defaults-conflict',
        params: {},
      });
    } finally {
      await database.destroy();
    }
  });
});

const emptyDefaults = {
  personaCharacterId: null,
  presetId: null,
  modelProviderId: null,
};

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

async function seedAssets(db: TestDatabase, ownerUserId: string, prefix = ''): Promise<void> {
  await db
    .insertInto('characters')
    .values({
      id: `${prefix}character`,
      owner_user_id: ownerUserId,
      avatar_resource_id: null,
      visibility: prefix ? 'public' : 'private',
      name: 'Character',
      nickname: null,
      comment: '',
      tags_json: '[]',
      version: '',
      creator: null,
      description: '',
      personality: '',
      scenario: '',
      first_message: '',
      alternate_greetings_json: '[]',
      group_only_greetings_json: '[]',
      message_example: '',
      creator_notes: '',
      creator_notes_multilingual_json: '{}',
      system_prompt: '',
      post_history_instructions: '',
      character_book_json: null,
      assets_json: '[]',
      source_json: '[]',
      metadata_json: '{}',
      source_format: 'sillytavern_v3',
      source_snapshot_json: '{}',
      created_at_ms: 1,
      updated_at_ms: 1,
      creation_date_ms: null,
      modification_date_ms: null,
      last_used_at_ms: null,
      usage_count: 0,
    })
    .execute();
  await db
    .insertInto('presets')
    .values({
      id: `${prefix}preset`,
      owner_user_id: ownerUserId,
      visibility: prefix ? 'public' : 'private',
      name: 'Preset',
      model_provider_id: null,
      model_settings_json: '{}',
      tokenizer: 'cl100k_base',
      source_format: 'rolesta',
      source_snapshot_json: '{}',
      created_at_ms: 1,
      updated_at_ms: 1,
      last_used_at_ms: null,
      usage_count: 0,
    })
    .execute();
  await db
    .insertInto('model_provider_configs')
    .values({
      id: `${prefix}provider`,
      owner_user_id: ownerUserId,
      name: 'Provider',
      provider_kind: 'openai-compatible',
      provider_source: 'custom',
      base_url: 'https://example.com/v1',
      default_model_name: '',
      credential_mode: 'manual',
      secret: '',
      api_key_id: null,
      created_at_ms: 1,
      updated_at_ms: 1,
      last_used_at_ms: null,
      usage_count: 0,
    })
    .execute();
}
