import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CryptoIdGenerator } from "../auth/infrastructure/crypto-id-generator.js";
import { SystemClock } from "../auth/infrastructure/system-clock.js";
import { DatabaseModule } from "../database/database.module.js";
import { ApiLoggerModule } from "../logging/api-logger.module.js";
import { CreateModelProviderApiKeyUseCase } from "./application/create-model-provider-api-key.use-case.js";
import { CreateModelProviderUseCase } from "./application/create-model-provider.use-case.js";
import { DeleteModelProviderApiKeyUseCase } from "./application/delete-model-provider-api-key.use-case.js";
import { DeleteModelProviderUseCase } from "./application/delete-model-provider.use-case.js";
import { GetModelProviderUseCase } from "./application/get-model-provider.use-case.js";
import { ListModelProviderModelsUseCase } from "./application/list-model-provider-models.use-case.js";
import { ListApiKeysUseCase } from "./application/list-api-keys.use-case.js";
import { ListModelProvidersUseCase } from "./application/list-model-providers.use-case.js";
import type {
  ModelProviderClock,
  ModelProviderIdGenerator,
} from "./application/model-provider-application-services.js";
import { TestModelProviderConnectionUseCase } from "./application/test-model-provider-connection.use-case.js";
import { UpdateModelProviderApiKeyUseCase } from "./application/update-model-provider-api-key.use-case.js";
import { UpdateModelProviderUseCase } from "./application/update-model-provider.use-case.js";
import { ModelProvidersController } from "./http/model-providers.controller.js";
import { ApiKeysController } from "./http/api-keys.controller.js";
import { FetchChatCompletionConnectionClient } from "./adapters/fetch-chat-completion-connection-client.js";
import {
  CHAT_COMPLETION_CONNECTION_CLIENT,
  type ChatCompletionConnectionClient,
} from "./ports/chat-completion-connection-client.js";
import {
  MODEL_PROVIDER_STORE,
  type ModelProviderStore,
} from "./ports/model-provider-store.js";
import { KyselyModelProviderStore } from "./persistence/kysely-model-provider-store.js";
import { KyselyApiKeyStore } from "./persistence/kysely-api-key-store.js";
import { API_KEY_STORE, type ApiKeyStore } from "./ports/api-key-store.js";

@Module({
  imports: [DatabaseModule, AuthModule, ApiLoggerModule],
  controllers: [ModelProvidersController, ApiKeysController],
  providers: [
    KyselyModelProviderStore,
    KyselyApiKeyStore,
    FetchChatCompletionConnectionClient,
    CryptoIdGenerator,
    SystemClock,
    { provide: MODEL_PROVIDER_STORE, useExisting: KyselyModelProviderStore },
    { provide: API_KEY_STORE, useExisting: KyselyApiKeyStore },
    {
      provide: CHAT_COMPLETION_CONNECTION_CLIENT,
      useExisting: FetchChatCompletionConnectionClient,
    },
    {
      provide: ListModelProvidersUseCase,
      useFactory: (store: ModelProviderStore) =>
        new ListModelProvidersUseCase(store),
      inject: [MODEL_PROVIDER_STORE],
    },
    {
      provide: GetModelProviderUseCase,
      useFactory: (store: ModelProviderStore) =>
        new GetModelProviderUseCase(store),
      inject: [MODEL_PROVIDER_STORE],
    },
    {
      provide: CreateModelProviderUseCase,
      useFactory: (
        store: ModelProviderStore,
        idGenerator: ModelProviderIdGenerator,
        clock: ModelProviderClock,
        apiKeyStore: ApiKeyStore,
      ) =>
        new CreateModelProviderUseCase(store, idGenerator, clock, apiKeyStore),
      inject: [
        MODEL_PROVIDER_STORE,
        CryptoIdGenerator,
        SystemClock,
        API_KEY_STORE,
      ],
    },
    {
      provide: UpdateModelProviderUseCase,
      useFactory: (
        store: ModelProviderStore,
        clock: ModelProviderClock,
        apiKeyStore: ApiKeyStore,
      ) => new UpdateModelProviderUseCase(store, clock, apiKeyStore),
      inject: [MODEL_PROVIDER_STORE, SystemClock, API_KEY_STORE],
    },
    {
      provide: DeleteModelProviderUseCase,
      useFactory: (store: ModelProviderStore) =>
        new DeleteModelProviderUseCase(store),
      inject: [MODEL_PROVIDER_STORE],
    },
    {
      provide: CreateModelProviderApiKeyUseCase,
      useFactory: (
        store: ApiKeyStore,
        idGenerator: ModelProviderIdGenerator,
        clock: ModelProviderClock,
      ) => new CreateModelProviderApiKeyUseCase(store, idGenerator, clock),
      inject: [API_KEY_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: UpdateModelProviderApiKeyUseCase,
      useFactory: (store: ApiKeyStore, clock: ModelProviderClock) =>
        new UpdateModelProviderApiKeyUseCase(store, clock),
      inject: [API_KEY_STORE, SystemClock],
    },
    {
      provide: DeleteModelProviderApiKeyUseCase,
      useFactory: (store: ApiKeyStore, clock: ModelProviderClock) =>
        new DeleteModelProviderApiKeyUseCase(store, clock),
      inject: [API_KEY_STORE, SystemClock],
    },
    {
      provide: ListApiKeysUseCase,
      useFactory: (store: ApiKeyStore) => new ListApiKeysUseCase(store),
      inject: [API_KEY_STORE],
    },
    {
      provide: ListModelProviderModelsUseCase,
      useFactory: (
        store: ModelProviderStore,
        client: ChatCompletionConnectionClient,
        apiKeyStore: ApiKeyStore,
      ) => new ListModelProviderModelsUseCase(store, client, apiKeyStore),
      inject: [
        MODEL_PROVIDER_STORE,
        CHAT_COMPLETION_CONNECTION_CLIENT,
        API_KEY_STORE,
      ],
    },
    {
      provide: TestModelProviderConnectionUseCase,
      useFactory: (
        store: ModelProviderStore,
        client: ChatCompletionConnectionClient,
        apiKeyStore: ApiKeyStore,
      ) => new TestModelProviderConnectionUseCase(store, client, apiKeyStore),
      inject: [
        MODEL_PROVIDER_STORE,
        CHAT_COMPLETION_CONNECTION_CLIENT,
        API_KEY_STORE,
      ],
    },
  ],
})
export class ModelProfilesModule {}
