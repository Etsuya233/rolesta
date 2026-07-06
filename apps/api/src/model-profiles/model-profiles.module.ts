import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CryptoIdGenerator } from '../auth/infrastructure/crypto-id-generator.js';
import { SystemClock } from '../auth/infrastructure/system-clock.js';
import { DatabaseModule } from '../database/database.module.js';
import { ApiLoggerModule } from '../logging/api-logger.module.js';
import {
  CHAT_COMPLETION_CONNECTION_CLIENT,
  type ChatCompletionConnectionClient,
} from './application/chat-completion-connection-client.js';
import { CreateModelProviderApiKeyUseCase } from './application/create-model-provider-api-key.use-case.js';
import { CreateModelProviderUseCase } from './application/create-model-provider.use-case.js';
import { DeleteModelProviderApiKeyUseCase } from './application/delete-model-provider-api-key.use-case.js';
import { DeleteModelProviderUseCase } from './application/delete-model-provider.use-case.js';
import { GetModelProviderUseCase } from './application/get-model-provider.use-case.js';
import { ListModelProviderModelsUseCase } from './application/list-model-provider-models.use-case.js';
import { ListModelProvidersUseCase } from './application/list-model-providers.use-case.js';
import type {
  ModelProviderClock,
  ModelProviderIdGenerator,
} from './application/model-provider-application-services.js';
import {
  MODEL_PROVIDER_STORE,
  type ModelProviderStore,
} from './application/model-provider-store.js';
import { SetSelectedModelProviderApiKeyUseCase } from './application/set-selected-model-provider-api-key.use-case.js';
import { TestModelProviderConnectionUseCase } from './application/test-model-provider-connection.use-case.js';
import { UpdateModelProviderApiKeyUseCase } from './application/update-model-provider-api-key.use-case.js';
import { UpdateModelProviderUseCase } from './application/update-model-provider.use-case.js';
import { ModelProvidersController } from './http/model-providers.controller.js';
import { FetchChatCompletionConnectionClient } from './infrastructure/fetch-chat-completion-connection-client.js';
import { KyselyModelProviderStore } from './infrastructure/kysely-model-provider-store.js';

@Module({
  imports: [DatabaseModule, AuthModule, ApiLoggerModule],
  controllers: [ModelProvidersController],
  providers: [
    KyselyModelProviderStore,
    FetchChatCompletionConnectionClient,
    CryptoIdGenerator,
    SystemClock,
    { provide: MODEL_PROVIDER_STORE, useExisting: KyselyModelProviderStore },
    {
      provide: CHAT_COMPLETION_CONNECTION_CLIENT,
      useExisting: FetchChatCompletionConnectionClient,
    },
    {
      provide: ListModelProvidersUseCase,
      useFactory: (store: ModelProviderStore) => new ListModelProvidersUseCase(store),
      inject: [MODEL_PROVIDER_STORE],
    },
    {
      provide: GetModelProviderUseCase,
      useFactory: (store: ModelProviderStore) => new GetModelProviderUseCase(store),
      inject: [MODEL_PROVIDER_STORE],
    },
    {
      provide: CreateModelProviderUseCase,
      useFactory: (
        store: ModelProviderStore,
        idGenerator: ModelProviderIdGenerator,
        clock: ModelProviderClock,
      ) => new CreateModelProviderUseCase(store, idGenerator, clock),
      inject: [MODEL_PROVIDER_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: UpdateModelProviderUseCase,
      useFactory: (store: ModelProviderStore, clock: ModelProviderClock) =>
        new UpdateModelProviderUseCase(store, clock),
      inject: [MODEL_PROVIDER_STORE, SystemClock],
    },
    {
      provide: DeleteModelProviderUseCase,
      useFactory: (store: ModelProviderStore) => new DeleteModelProviderUseCase(store),
      inject: [MODEL_PROVIDER_STORE],
    },
    {
      provide: CreateModelProviderApiKeyUseCase,
      useFactory: (
        store: ModelProviderStore,
        idGenerator: ModelProviderIdGenerator,
        clock: ModelProviderClock,
      ) => new CreateModelProviderApiKeyUseCase(store, idGenerator, clock),
      inject: [MODEL_PROVIDER_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: UpdateModelProviderApiKeyUseCase,
      useFactory: (store: ModelProviderStore, clock: ModelProviderClock) =>
        new UpdateModelProviderApiKeyUseCase(store, clock),
      inject: [MODEL_PROVIDER_STORE, SystemClock],
    },
    {
      provide: DeleteModelProviderApiKeyUseCase,
      useFactory: (store: ModelProviderStore, clock: ModelProviderClock) =>
        new DeleteModelProviderApiKeyUseCase(store, clock),
      inject: [MODEL_PROVIDER_STORE, SystemClock],
    },
    {
      provide: SetSelectedModelProviderApiKeyUseCase,
      useFactory: (store: ModelProviderStore, clock: ModelProviderClock) =>
        new SetSelectedModelProviderApiKeyUseCase(store, clock),
      inject: [MODEL_PROVIDER_STORE, SystemClock],
    },
    {
      provide: ListModelProviderModelsUseCase,
      useFactory: (
        store: ModelProviderStore,
        client: ChatCompletionConnectionClient,
      ) => new ListModelProviderModelsUseCase(store, client),
      inject: [MODEL_PROVIDER_STORE, CHAT_COMPLETION_CONNECTION_CLIENT],
    },
    {
      provide: TestModelProviderConnectionUseCase,
      useFactory: (
        store: ModelProviderStore,
        client: ChatCompletionConnectionClient,
      ) => new TestModelProviderConnectionUseCase(store, client),
      inject: [MODEL_PROVIDER_STORE, CHAT_COMPLETION_CONNECTION_CLIENT],
    },
  ],
})
export class ModelProfilesModule {}
