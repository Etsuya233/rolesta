import { UseCase } from '../../common/errors/index.js';
import type { ModelProviderKind } from '../domain/model-provider-catalog.js';
import type { ChatCompletionConnectionClient } from '../ports/chat-completion-connection-client.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import { translateModelProviderError } from './model-provider-error.mapper.js';
import type { ModelProviderStore } from '../ports/model-provider-store.js';
import type { ApiKeyStore } from '../ports/api-key-store.js';
import { apiKeySecret, modelProviderSecret } from './model-provider-credential.js';
import { validateProviderConnection } from '../domain/model-provider-validation.js';

export interface TestModelProviderConnectionResult {
  ok: true;
  modelName: string;
  elapsedMs: number;
  remoteResponseId: string | null;
}

export interface TestModelProviderConnectionPreviewCommand {
  providerKind: ModelProviderKind;
  baseUrl: string;
  defaultModelName: string;
  apiKeySecret: string | undefined;
  apiKeyId?: string;
  viewerUserId?: string;
}

export interface TestModelProviderConnectionCommand {
  configId: string;
  viewerUserId: string;
}

export class TestModelProviderConnectionUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly client: ChatCompletionConnectionClient,
    private readonly apiKeyStore: ApiKeyStore,
  ) {}

  @UseCase(translateModelProviderError)
  async preview(
    command: TestModelProviderConnectionPreviewCommand,
  ): Promise<TestModelProviderConnectionResult> {
    const connection = validateProviderConnection(command.providerKind, command.baseUrl);
    const defaultModelName = command.defaultModelName.trim();

    if (defaultModelName.length === 0) {
      throw new ModelProviderApplicationError('model-name-required', {});
    }

    const startedAt = Date.now();
    const result = await this.client.testChatCompletion({
      providerKind: connection.providerKind,
      baseUrl: connection.baseUrl,
      defaultModelName,
      apiKeySecret:
        command.apiKeyId && command.viewerUserId
          ? await apiKeySecret(command.apiKeyId, command.viewerUserId, this.apiKeyStore)
          : command.apiKeySecret,
    });

    return {
      ok: true,
      modelName: result.modelName,
      elapsedMs: Date.now() - startedAt,
      remoteResponseId: result.remoteResponseId,
    };
  }

  @UseCase(translateModelProviderError)
  async saved(
    command: TestModelProviderConnectionCommand,
  ): Promise<TestModelProviderConnectionResult> {
    const config = await this.store.findOwnedById(command.configId, command.viewerUserId);

    if (config === null) {
      throw new ModelProviderApplicationError('not-found', {});
    }

    return this.preview({
      providerKind: config.providerKind,
      baseUrl: config.baseUrl,
      defaultModelName: config.defaultModelName,
      apiKeySecret: await modelProviderSecret(config, this.apiKeyStore),
    });
  }
}
