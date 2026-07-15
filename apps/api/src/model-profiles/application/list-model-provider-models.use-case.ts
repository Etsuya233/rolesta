import { UseCase } from '../../common/errors/index.js';
import type { ModelProviderKind } from '../domain/model-provider-catalog.js';
import type { ChatCompletionConnectionClient } from '../ports/chat-completion-connection-client.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import { translateModelProviderError } from './model-provider-error.mapper.js';
import type { ModelProviderStore } from '../ports/model-provider-store.js';
import type { ApiKeyStore } from '../ports/api-key-store.js';
import { apiKeySecret, modelProviderSecret } from './model-provider-credential.js';
import { validateProviderConnection } from '../domain/model-provider-validation.js';

export interface ModelProviderModelListResult {
  models: string[];
  elapsedMs: number;
}

export interface ListModelProviderModelsPreviewCommand {
  providerKind: ModelProviderKind;
  baseUrl: string;
  apiKeySecret: string | undefined;
  apiKeyId?: string;
  viewerUserId?: string;
}

export interface ListModelProviderModelsCommand {
  configId: string;
  viewerUserId: string;
}

export class ListModelProviderModelsUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly client: ChatCompletionConnectionClient,
    private readonly apiKeyStore: ApiKeyStore,
  ) {}

  @UseCase(translateModelProviderError)
  async preview(
    command: ListModelProviderModelsPreviewCommand,
  ): Promise<ModelProviderModelListResult> {
    const connection = validateProviderConnection(command.providerKind, command.baseUrl);
    const startedAt = Date.now();
    const models = await this.client.listModels({
      providerKind: connection.providerKind,
      baseUrl: connection.baseUrl,
      apiKeySecret:
        command.apiKeyId && command.viewerUserId
          ? await apiKeySecret(command.apiKeyId, command.viewerUserId, this.apiKeyStore)
          : command.apiKeySecret,
    });

    return { models, elapsedMs: Date.now() - startedAt };
  }

  @UseCase(translateModelProviderError)
  async saved(command: ListModelProviderModelsCommand): Promise<ModelProviderModelListResult> {
    const config = await this.store.findOwnedById(command.configId, command.viewerUserId);

    if (config === null) {
      throw new ModelProviderApplicationError('not-found', {});
    }

    return this.preview({
      providerKind: config.providerKind,
      baseUrl: config.baseUrl,
      apiKeySecret: await modelProviderSecret(config, this.apiKeyStore),
    });
  }
}
