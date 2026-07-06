import type { ModelProviderKind } from '../domain/model-provider-catalog.js';
import type { ChatCompletionConnectionClient } from './chat-completion-connection-client.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import type { ModelProviderStore } from './model-provider-store.js';
import { validateProviderConnection } from './model-provider-validation.js';

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
}

export interface TestModelProviderConnectionCommand {
  configId: string;
  viewerUserId: string;
}

export class TestModelProviderConnectionUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly client: ChatCompletionConnectionClient,
  ) {}

  async preview(
    command: TestModelProviderConnectionPreviewCommand,
  ): Promise<TestModelProviderConnectionResult> {
    const connection = validateProviderConnection(command.providerKind, command.baseUrl);
    const defaultModelName = command.defaultModelName.trim();

    if (defaultModelName.length === 0) {
      throw new ModelProviderApplicationError('model-name-required');
    }

    const startedAt = Date.now();
    const result = await this.client.testChatCompletion({
      providerKind: connection.providerKind,
      baseUrl: connection.baseUrl,
      defaultModelName,
      apiKeySecret: command.apiKeySecret,
    });

    return {
      ok: true,
      modelName: result.modelName,
      elapsedMs: Date.now() - startedAt,
      remoteResponseId: result.remoteResponseId,
    };
  }

  async saved(command: TestModelProviderConnectionCommand): Promise<TestModelProviderConnectionResult> {
    const config = await this.store.findOwnedById(command.configId, command.viewerUserId);

    if (config === null) {
      throw new ModelProviderApplicationError('not-found');
    }

    return this.preview({
      providerKind: config.providerKind,
      baseUrl: config.baseUrl,
      defaultModelName: config.defaultModelName,
      apiKeySecret: config.apiKeys.find((apiKey) => apiKey.id === config.selectedApiKeyId)?.secret,
    });
  }
}
