import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../../packages/db/src/test-utils/create-test-database.js';
import { DomainEventPublisher, DomainEventsModule } from '../../common/events/index.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import { KyselyUnitOfWork } from '../../database/kysely-unit-of-work.js';
import { ModelProviderDeletedEventsListener } from '../../presets/application/model-provider-deleted-events.listener.js';
import { createDefaultPresetModelSettings } from '../../presets/domain/preset-model-settings.js';
import { createDefaultPresetPromptItems, type Preset } from '../../presets/domain/preset.js';
import { KyselyPresetStore } from '../../presets/persistence/kysely-preset-store.js';
import { PRESET_STORE } from '../../presets/ports/preset-store.js';
import type { ModelProviderConfig } from '../domain/model-provider-config.js';
import { DeleteModelProviderUseCase } from '../application/delete-model-provider.use-case.js';
import { KyselyModelProviderStore } from './kysely-model-provider-store.js';

describe('model provider deletion', () => {
  it('clears preset associations when deleting an owned model provider', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);
    const providers = new KyselyModelProviderStore(context);
    const presets = new KyselyPresetStore(context);
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventsModule],
      providers: [{ provide: PRESET_STORE, useValue: presets }, ModelProviderDeletedEventsListener],
    }).compile();
    await moduleRef.init();

    try {
      await seedUser(database.db, 'owner');
      await unitOfWork.run(async () => {
        await providers.save(modelProvider());
        await presets.save(linkedPreset());
      });

      await new DeleteModelProviderUseCase(
        providers,
        { now: () => new Date(10) },
        unitOfWork,
        moduleRef.get(DomainEventPublisher),
      ).execute({
        id: 'provider_1',
        viewerUserId: 'owner',
      });

      await expect(presets.findOwnedById('preset_1', 'owner')).resolves.toMatchObject({
        modelProviderId: null,
      });
      await expect(providers.findOwnedById('provider_1', 'owner')).resolves.toBeNull();
    } finally {
      await moduleRef.close();
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

function modelProvider(): ModelProviderConfig {
  return {
    id: 'provider_1',
    ownerUserId: 'owner',
    name: 'Provider',
    providerKind: 'openai-compatible',
    providerSource: 'custom',
    baseUrl: 'https://example.com/v1',
    defaultModelName: 'model',
    credentialMode: 'manual',
    secret: '',
    apiKeyId: null,
    apiKeyName: null,
    createdAtMs: 1,
    updatedAtMs: 1,
    lastUsedAtMs: null,
    usageCount: 0,
  };
}

function linkedPreset(): Preset {
  let itemId = 0;
  return {
    id: 'preset_1',
    ownerUserId: 'owner',
    visibility: 'private',
    name: 'Preset',
    modelProviderId: 'provider_1',
    modelSettings: createDefaultPresetModelSettings(),
    tokenizer: 'cl100k_base',
    entries: [],
    promptItems: createDefaultPresetPromptItems(() => `item_${++itemId}`),
    tokenCount: 0,
    sourceFormat: 'rolesta',
    sourceSnapshot: {},
    createdAtMs: 1,
    updatedAtMs: 1,
    lastUsedAtMs: null,
    usageCount: 0,
  };
}
