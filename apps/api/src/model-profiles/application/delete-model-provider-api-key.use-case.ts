import { UseCase } from '../../common/errors/index.js';
import type { ModelProviderConfig } from '../domain/model-provider-config.js';
import type { ModelProviderClock } from './model-provider-application-services.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import { translateModelProviderError } from './model-provider-error.mapper.js';
import type { ModelProviderStore } from '../ports/model-provider-store.js';

export interface DeleteModelProviderApiKeyCommand {
  configId: string;
  apiKeyId: string;
  viewerUserId: string;
}

export class DeleteModelProviderApiKeyUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly clock: ModelProviderClock,
  ) {}

  @UseCase(translateModelProviderError)
  async execute(command: DeleteModelProviderApiKeyCommand): Promise<ModelProviderConfig> {
    const config = await this.store.findOwnedById(command.configId, command.viewerUserId);

    if (config === null) {
      throw new ModelProviderApplicationError('not-found', {});
    }

    if (!config.apiKeys.some((apiKey) => apiKey.id === command.apiKeyId)) {
      throw new ModelProviderApplicationError('not-found', {});
    }

    const updatedAtMs = this.clock.now().getTime();
    const deleted = await this.store.deleteApiKeyAndTouchConfig(
      config.id,
      command.apiKeyId,
      updatedAtMs,
    );

    if (!deleted) {
      throw new ModelProviderApplicationError('not-found', {});
    }

    const nextConfig: ModelProviderConfig = {
      ...config,
      selectedApiKeyId:
        config.selectedApiKeyId === command.apiKeyId ? null : config.selectedApiKeyId,
      apiKeys: config.apiKeys.filter((apiKey) => apiKey.id !== command.apiKeyId),
      updatedAtMs,
    };

    return nextConfig;
  }
}
