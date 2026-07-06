import type { ModelProviderConfig } from '../domain/model-provider-config.js';
import type { ModelProviderClock } from './model-provider-application-services.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import type { ModelProviderStore } from './model-provider-store.js';

export interface SetSelectedModelProviderApiKeyCommand {
  configId: string;
  viewerUserId: string;
  selectedApiKeyId: string | null;
}

export class SetSelectedModelProviderApiKeyUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly clock: ModelProviderClock,
  ) {}

  async execute(command: SetSelectedModelProviderApiKeyCommand): Promise<ModelProviderConfig> {
    const config = await this.store.findOwnedById(command.configId, command.viewerUserId);

    if (config === null) {
      throw new ModelProviderApplicationError('not-found');
    }

    if (
      command.selectedApiKeyId !== null &&
      !config.apiKeys.some((apiKey) => apiKey.id === command.selectedApiKeyId)
    ) {
      throw new ModelProviderApplicationError('api-key-not-owned');
    }

    const nextConfig = {
      ...config,
      selectedApiKeyId: command.selectedApiKeyId,
      updatedAtMs: this.clock.now().getTime(),
    };

    await this.store.update(nextConfig);

    return nextConfig;
  }
}
