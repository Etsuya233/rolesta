import type { PageResponse } from '@rolesta/shared';
import { describe, expect, it } from 'vitest';
import type {
  ChatCompletionConnectionClient,
  ListChatCompletionModelsRequest,
  TestChatCompletionRequest,
  TestChatCompletionResult,
} from './chat-completion-connection-client.js';
import { CreateModelProviderApiKeyUseCase } from './create-model-provider-api-key.use-case.js';
import { CreateModelProviderUseCase } from './create-model-provider.use-case.js';
import { DeleteModelProviderApiKeyUseCase } from './delete-model-provider-api-key.use-case.js';
import { ListModelProviderModelsUseCase } from './list-model-provider-models.use-case.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import type {
  ListModelProvidersRequest,
  ModelProviderStore,
} from './model-provider-store.js';
import { TestModelProviderConnectionUseCase } from './test-model-provider-connection.use-case.js';
import { UpdateModelProviderUseCase } from './update-model-provider.use-case.js';
import type {
  ModelProviderApiKey,
  ModelProviderConfig,
  ModelProviderSummary,
} from '../domain/model-provider-config.js';

describe('model provider use cases', () => {
  it('allows custom compatible configs to save a custom base URL without a key', async () => {
    const store = new InMemoryModelProviderStore();
    const useCase = new CreateModelProviderUseCase(
      store,
      new IncrementingIdGenerator(),
      new FixedClock(1783090000000),
    );

    const config = await useCase.execute({
      ownerUserId: 'owner',
      name: 'Local',
      providerKind: 'openai-compatible',
      baseUrl: 'https://local.example/v1/',
    });

    expect(config).toMatchObject({
      id: 'id_1',
      providerKind: 'openai-compatible',
      providerSource: 'custom',
      baseUrl: 'https://local.example/v1',
      defaultModelName: '',
      selectedApiKeyId: null,
      apiKeys: [],
    });
  });

  it('rejects official providers when the base URL is outside the registry', async () => {
    const store = new InMemoryModelProviderStore([
      modelProviderConfig({ id: 'cfg_1', providerKind: 'openai', baseUrl: 'https://api.openai.com/v1' }),
    ]);
    const useCase = new UpdateModelProviderUseCase(store, new FixedClock(1783090000100));

    await expect(
      useCase.execute({
        id: 'cfg_1',
        viewerUserId: 'owner',
        baseUrl: 'https://proxy.example/v1',
      }),
    ).rejects.toMatchObject(new ModelProviderApplicationError('invalid-base-url'));
  });

  it('clears the selected key when deleting the selected API key', async () => {
    const config = modelProviderConfig({
      id: 'cfg_1',
      selectedApiKeyId: 'key_1',
      apiKeys: [
        modelProviderApiKey({ id: 'key_1', configId: 'cfg_1' }),
        modelProviderApiKey({ id: 'key_2', configId: 'cfg_1' }),
      ],
    });
    const store = new InMemoryModelProviderStore([config]);
    const useCase = new DeleteModelProviderApiKeyUseCase(store, new FixedClock(1783090000200));

    const next = await useCase.execute({
      configId: 'cfg_1',
      apiKeyId: 'key_1',
      viewerUserId: 'owner',
    });

    expect(next.selectedApiKeyId).toBeNull();
    expect(next.apiKeys.map((apiKey) => apiKey.id)).toEqual(['key_2']);
  });

  it('does not send an authorization secret when testing a config without a key', async () => {
    const store = new InMemoryModelProviderStore([
      modelProviderConfig({
        id: 'cfg_1',
        defaultModelName: 'gpt-test',
        selectedApiKeyId: null,
        apiKeys: [],
      }),
    ]);
    const client = new RecordingConnectionClient();
    const useCase = new TestModelProviderConnectionUseCase(store, client);

    await expect(
      useCase.saved({ configId: 'cfg_1', viewerUserId: 'owner' }),
    ).resolves.toMatchObject({ ok: true, modelName: 'gpt-test' });
    expect(client.lastTestRequest?.apiKeySecret).toBeUndefined();
  });

  it('uses the selected API key secret for remote model listing', async () => {
    const store = new InMemoryModelProviderStore([
      modelProviderConfig({
        id: 'cfg_1',
        selectedApiKeyId: 'key_1',
        apiKeys: [modelProviderApiKey({ id: 'key_1', configId: 'cfg_1', secret: 'secret_1' })],
      }),
    ]);
    const client = new RecordingConnectionClient();
    const useCase = new ListModelProviderModelsUseCase(store, client);

    const result = await useCase.saved({ configId: 'cfg_1', viewerUserId: 'owner' });

    expect(result.models).toEqual(['model-a']);
    expect(typeof result.elapsedMs).toBe('number');
    expect(client.lastListRequest?.apiKeySecret).toBe('secret_1');
  });

  it('creates API keys without selecting them implicitly', async () => {
    const store = new InMemoryModelProviderStore([modelProviderConfig({ id: 'cfg_1' })]);
    const useCase = new CreateModelProviderApiKeyUseCase(
      store,
      new IncrementingIdGenerator(),
      new FixedClock(1783090000300),
    );

    const config = await useCase.execute({
      configId: 'cfg_1',
      viewerUserId: 'owner',
      name: 'Main',
      secret: 'secret',
    });

    expect(config.selectedApiKeyId).toBeNull();
    expect(config.apiKeys).toHaveLength(1);
  });
});

class InMemoryModelProviderStore implements ModelProviderStore {
  private readonly configs = new Map<string, ModelProviderConfig>();

  constructor(configs: ModelProviderConfig[] = []) {
    for (const config of configs) {
      this.configs.set(config.id, cloneConfig(config));
    }
  }

  list(request: ListModelProvidersRequest): Promise<PageResponse<ModelProviderSummary>> {
    const items = [...this.configs.values()]
      .filter((config) => config.ownerUserId === request.viewerUserId)
      .map((config) => ({ ...config, apiKeyCount: config.apiKeys.length }));

    return Promise.resolve({
      items,
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems: items.length,
      totalPages: 1,
    });
  }

  findOwnedById(id: string, ownerUserId: string): Promise<ModelProviderConfig | null> {
    const config = this.configs.get(id);
    return Promise.resolve(config?.ownerUserId === ownerUserId ? cloneConfig(config) : null);
  }

  save(config: ModelProviderConfig): Promise<void> {
    this.configs.set(config.id, cloneConfig(config));
    return Promise.resolve();
  }

  update(config: ModelProviderConfig): Promise<void> {
    this.configs.set(config.id, cloneConfig(config));
    return Promise.resolve();
  }

  deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const config = this.configs.get(id);

    if (config?.ownerUserId !== ownerUserId) {
      return Promise.resolve(false);
    }

    return Promise.resolve(this.configs.delete(id));
  }

  addApiKey(apiKey: ModelProviderApiKey): Promise<void> {
    const config = this.configs.get(apiKey.configId);

    if (config) {
      this.configs.set(config.id, {
        ...config,
        apiKeys: [...config.apiKeys, { ...apiKey }],
      });
    }

    return Promise.resolve();
  }

  updateApiKey(apiKey: ModelProviderApiKey): Promise<void> {
    const config = this.configs.get(apiKey.configId);

    if (config) {
      this.configs.set(config.id, {
        ...config,
        apiKeys: config.apiKeys.map((candidate) =>
          candidate.id === apiKey.id ? { ...apiKey } : candidate,
        ),
      });
    }

    return Promise.resolve();
  }

  deleteApiKeyAndTouchConfig(
    configId: string,
    apiKeyId: string,
    updatedAtMs: number,
  ): Promise<boolean> {
    const config = this.configs.get(configId);

    if (!config || !config.apiKeys.some((apiKey) => apiKey.id === apiKeyId)) {
      return Promise.resolve(false);
    }

    this.configs.set(config.id, {
      ...config,
      selectedApiKeyId: config.selectedApiKeyId === apiKeyId ? null : config.selectedApiKeyId,
      apiKeys: config.apiKeys.filter((apiKey) => apiKey.id !== apiKeyId),
      updatedAtMs,
    });

    return Promise.resolve(true);
  }
}

class RecordingConnectionClient implements ChatCompletionConnectionClient {
  lastListRequest: ListChatCompletionModelsRequest | null = null;
  lastTestRequest: TestChatCompletionRequest | null = null;

  listModels(request: ListChatCompletionModelsRequest): Promise<string[]> {
    this.lastListRequest = request;
    return Promise.resolve(['model-a']);
  }

  testChatCompletion(request: TestChatCompletionRequest): Promise<TestChatCompletionResult> {
    this.lastTestRequest = request;
    return Promise.resolve({
      modelName: request.defaultModelName,
      remoteResponseId: 'resp_1',
    });
  }
}

class IncrementingIdGenerator {
  private nextId = 1;

  createId(): string {
    const id = `id_${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}

class FixedClock {
  constructor(private readonly nowMs: number) {}

  now(): Date {
    return new Date(this.nowMs);
  }
}

function modelProviderConfig(
  overrides: Partial<ModelProviderConfig> = {},
): ModelProviderConfig {
  return {
    id: 'cfg',
    ownerUserId: 'owner',
    name: 'Config',
    providerKind: 'openai-compatible',
    providerSource: 'custom',
    baseUrl: 'https://local.example/v1',
    defaultModelName: '',
    selectedApiKeyId: null,
    apiKeys: [],
    createdAtMs: 1783090000000,
    updatedAtMs: 1783090000000,
    lastUsedAtMs: null,
    usageCount: 0,
    ...overrides,
  };
}

function modelProviderApiKey(
  overrides: Partial<ModelProviderApiKey> = {},
): ModelProviderApiKey {
  return {
    id: 'key',
    configId: 'cfg',
    name: 'Key',
    secret: 'secret',
    createdAtMs: 1783090000000,
    updatedAtMs: 1783090000000,
    ...overrides,
  };
}

function cloneConfig(config: ModelProviderConfig): ModelProviderConfig {
  return {
    ...config,
    apiKeys: config.apiKeys.map((apiKey) => ({ ...apiKey })),
  };
}
