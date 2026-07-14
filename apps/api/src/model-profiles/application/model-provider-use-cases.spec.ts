import type { PageResponse } from "@rolesta/shared";
import { describe, expect, it } from "vitest";
import type { UnitOfWork } from "../../common/application/unit-of-work.js";
import type {
  ApiKey,
  ModelProviderConfig,
  ModelProviderSummary,
} from "../domain/model-provider-config.js";
import type { ApiKeyStore } from "../ports/api-key-store.js";
import type {
  ChatCompletionConnectionClient,
  ListChatCompletionModelsRequest,
  TestChatCompletionRequest,
  TestChatCompletionResult,
} from "../ports/chat-completion-connection-client.js";
import type {
  ListModelProvidersRequest,
  ModelProviderStore,
} from "../ports/model-provider-store.js";
import { CreateModelProviderUseCase } from "./create-model-provider.use-case.js";
import { DeleteModelProviderApiKeyUseCase } from "./delete-model-provider-api-key.use-case.js";
import { ListModelProviderModelsUseCase } from "./list-model-provider-models.use-case.js";
import { ModelProviderApplicationError } from "./model-provider-application-error.js";
import { TestModelProviderConnectionUseCase } from "./test-model-provider-connection.use-case.js";
import { UpdateModelProviderUseCase } from "./update-model-provider.use-case.js";

describe("model provider use cases", () => {
  it("creates a provider with a manual secret", async () => {
    const state = new MemoryState();
    const useCase = new CreateModelProviderUseCase(
      state.providers,
      ids,
      clock,
      state.keys,
    );
    const config = await useCase.execute({
      ownerUserId: "owner",
      name: "Local",
      providerKind: "openai-compatible",
      baseUrl: "https://local.example/v1/",
      credentialMode: "manual",
      secret: "manual-secret",
    });
    expect(config).toMatchObject({
      baseUrl: "https://local.example/v1",
      credentialMode: "manual",
      secret: "manual-secret",
      apiKeyId: null,
    });
  });

  it("rejects a vault key owned by another user", async () => {
    const state = new MemoryState([], [apiKey({ ownerUserId: "other" })]);
    const useCase = new CreateModelProviderUseCase(
      state.providers,
      ids,
      clock,
      state.keys,
    );
    await expect(
      useCase.execute({
        ownerUserId: "owner",
        name: "Remote",
        providerKind: "openai",
        baseUrl: "https://api.openai.com/v1",
        credentialMode: "vault",
        apiKeyId: "key",
      }),
    ).rejects.toMatchObject(
      new ModelProviderApplicationError("api-key-not-owned", {}),
    );
  });

  it("switches credentials without retaining the inactive value", async () => {
    const state = new MemoryState(
      [provider({ secret: "manual-secret" })],
      [apiKey()],
    );
    const useCase = new UpdateModelProviderUseCase(
      state.providers,
      clock,
      state.keys,
    );
    const next = await useCase.execute({
      id: "cfg",
      viewerUserId: "owner",
      credentialMode: "vault",
      apiKeyId: "key",
    });
    expect(next).toMatchObject({
      credentialMode: "vault",
      secret: "",
      apiKeyId: "key",
      apiKeyName: "Key",
    });
  });

  it("uses the global key secret for model listing", async () => {
    const state = new MemoryState(
      [
        provider({
          credentialMode: "vault",
          apiKeyId: "key",
          apiKeyName: "Key",
        }),
      ],
      [apiKey({ secret: "vault-secret" })],
    );
    const client = new RecordingClient();
    await new ListModelProviderModelsUseCase(
      state.providers,
      client,
      state.keys,
    ).saved({ configId: "cfg", viewerUserId: "owner" });
    expect(client.lastListRequest?.apiKeySecret).toBe("vault-secret");
  });

  it("uses the manual secret for connection testing", async () => {
    const state = new MemoryState([
      provider({ secret: "manual-secret", defaultModelName: "model-a" }),
    ]);
    const client = new RecordingClient();
    await new TestModelProviderConnectionUseCase(
      state.providers,
      client,
      state.keys,
    ).saved({ configId: "cfg", viewerUserId: "owner" });
    expect(client.lastTestRequest?.apiKeySecret).toBe("manual-secret");
  });

  it("deletes a global key and clears every provider reference", async () => {
    const state = new MemoryState(
      [
        provider({ id: "cfg-1", credentialMode: "vault", apiKeyId: "key" }),
        provider({ id: "cfg-2", credentialMode: "vault", apiKeyId: "key" }),
      ],
      [apiKey()],
    );
    const result = await new DeleteModelProviderApiKeyUseCase(
      state.keys,
      clock,
      unitOfWork,
    ).execute({ apiKeyId: "key", ownerUserId: "owner" });
    expect(result.affectedProviderCount).toBe(2);
    expect(await state.providers.findOwnedById("cfg-1", "owner")).toMatchObject(
      { credentialMode: "manual", secret: "", apiKeyId: null },
    );
  });
});

const unitOfWork: UnitOfWork = { run: (operation) => operation() };

class MemoryState {
  readonly configs = new Map<string, ModelProviderConfig>();
  readonly apiKeys = new Map<string, ApiKey>();
  readonly providers = new MemoryModelProviderStore(this);
  readonly keys = new MemoryApiKeyStore(this);
  constructor(configs: ModelProviderConfig[] = [], keys: ApiKey[] = []) {
    configs.forEach((item) => this.configs.set(item.id, { ...item }));
    keys.forEach((item) => this.apiKeys.set(item.id, { ...item }));
  }
}

class MemoryModelProviderStore implements ModelProviderStore {
  constructor(private readonly state: MemoryState) {}
  list(
    request: ListModelProvidersRequest,
  ): Promise<PageResponse<ModelProviderSummary>> {
    const items = [...this.state.configs.values()].filter(
      (item) => item.ownerUserId === request.viewerUserId,
    );
    return Promise.resolve({
      items,
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems: items.length,
      totalPages: 1,
    });
  }
  findOwnedById(
    id: string,
    ownerUserId: string,
  ): Promise<ModelProviderConfig | null> {
    const item = this.state.configs.get(id);
    return Promise.resolve(
      item?.ownerUserId === ownerUserId ? { ...item } : null,
    );
  }
  save(config: ModelProviderConfig): Promise<void> {
    this.state.configs.set(config.id, { ...config });
    return Promise.resolve();
  }
  update(config: ModelProviderConfig): Promise<void> {
    this.state.configs.set(config.id, { ...config });
    return Promise.resolve();
  }
  deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const item = this.state.configs.get(id);
    return Promise.resolve(
      item?.ownerUserId === ownerUserId && this.state.configs.delete(id),
    );
  }
}

class MemoryApiKeyStore implements ApiKeyStore {
  constructor(private readonly state: MemoryState) {}
  listOwned(ownerUserId: string): Promise<ApiKey[]> {
    return Promise.resolve(
      [...this.state.apiKeys.values()].filter(
        (item) => item.ownerUserId === ownerUserId,
      ),
    );
  }
  findOwnedById(id: string, ownerUserId: string): Promise<ApiKey | null> {
    const item = this.state.apiKeys.get(id);
    return Promise.resolve(
      item?.ownerUserId === ownerUserId ? { ...item } : null,
    );
  }
  save(apiKey: ApiKey): Promise<void> {
    this.state.apiKeys.set(apiKey.id, { ...apiKey });
    return Promise.resolve();
  }
  update(apiKey: ApiKey): Promise<void> {
    this.state.apiKeys.set(apiKey.id, { ...apiKey });
    return Promise.resolve();
  }
  countProviderReferences(id: string, ownerUserId: string): Promise<number> {
    return Promise.resolve(
      [...this.state.configs.values()].filter(
        (item) => item.ownerUserId === ownerUserId && item.apiKeyId === id,
      ).length,
    );
  }
  async deleteOwnedAndClearProviderReferences(
    id: string,
    ownerUserId: string,
    updatedAtMs: number,
  ): Promise<number | null> {
    const key = await this.findOwnedById(id, ownerUserId);
    if (!key) return null;
    let count = 0;
    for (const [configId, config] of this.state.configs) {
      if (config.ownerUserId === ownerUserId && config.apiKeyId === id) {
        this.state.configs.set(configId, {
          ...config,
          credentialMode: "manual",
          secret: "",
          apiKeyId: null,
          apiKeyName: null,
          updatedAtMs,
        });
        count += 1;
      }
    }
    this.state.apiKeys.delete(id);
    return count;
  }
}

class RecordingClient implements ChatCompletionConnectionClient {
  lastListRequest: ListChatCompletionModelsRequest | null = null;
  lastTestRequest: TestChatCompletionRequest | null = null;
  listModels(request: ListChatCompletionModelsRequest): Promise<string[]> {
    this.lastListRequest = request;
    return Promise.resolve(["model-a"]);
  }
  testChatCompletion(
    request: TestChatCompletionRequest,
  ): Promise<TestChatCompletionResult> {
    this.lastTestRequest = request;
    return Promise.resolve({
      modelName: request.defaultModelName,
      remoteResponseId: "response",
    });
  }
}

const ids = { createId: () => "cfg" };
const clock = { now: () => new Date(1783090000000) };
function apiKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: "key",
    ownerUserId: "owner",
    name: "Key",
    secret: "secret",
    createdAtMs: 1,
    updatedAtMs: 1,
    ...overrides,
  };
}
function provider(
  overrides: Partial<ModelProviderConfig> = {},
): ModelProviderConfig {
  return {
    id: "cfg",
    ownerUserId: "owner",
    name: "Config",
    providerKind: "openai-compatible",
    providerSource: "custom",
    baseUrl: "https://local.example/v1",
    defaultModelName: "",
    credentialMode: "manual",
    secret: "",
    apiKeyId: null,
    apiKeyName: null,
    createdAtMs: 1,
    updatedAtMs: 1,
    lastUsedAtMs: null,
    usageCount: 0,
    ...overrides,
  };
}
