import type { ModelProviderConfig } from '../domain/model-provider-config.js';
import type { ModelProviderClock } from './model-provider-application-services.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import type { ModelProviderStore } from './model-provider-store.js';

export interface UpdateModelProviderApiKeyCommand {
  configId: string;
  apiKeyId: string;
  viewerUserId: string;
  name?: string;
  secret?: string;
}

export class UpdateModelProviderApiKeyUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly clock: ModelProviderClock,
  ) {}

  async execute(command: UpdateModelProviderApiKeyCommand): Promise<ModelProviderConfig> {
    const config = await this.store.findOwnedById(command.configId, command.viewerUserId);

    if (config === null) {
      throw new ModelProviderApplicationError('not-found');
    }

    const apiKey = config.apiKeys.find((candidate) => candidate.id === command.apiKeyId);

    if (apiKey === undefined) {
      throw new ModelProviderApplicationError('not-found');
    }

    const nextApiKey = {
      ...apiKey,
      name: command.name === undefined ? apiKey.name : command.name.trim(),
      secret: command.secret === undefined ? apiKey.secret : command.secret,
      updatedAtMs: this.clock.now().getTime(),
    };

    await this.store.updateApiKey(nextApiKey);

    return {
      ...config,
      apiKeys: config.apiKeys.map((candidate) =>
        candidate.id === nextApiKey.id ? nextApiKey : candidate,
      ),
    };
  }
}
