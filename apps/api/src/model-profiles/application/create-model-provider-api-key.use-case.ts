import { UseCase } from '../../common/errors/index.js';
import type {
  ModelProviderClock,
  ModelProviderIdGenerator,
} from './model-provider-application-services.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import { translateModelProviderError } from './model-provider-error.mapper.js';
import type { ModelProviderStore } from '../ports/model-provider-store.js';
import type { ModelProviderConfig } from '../domain/model-provider-config.js';

export interface CreateModelProviderApiKeyCommand {
  configId: string;
  viewerUserId: string;
  name: string;
  secret: string;
}

export class CreateModelProviderApiKeyUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly idGenerator: ModelProviderIdGenerator,
    private readonly clock: ModelProviderClock,
  ) {}

  @UseCase(translateModelProviderError)
  async execute(command: CreateModelProviderApiKeyCommand): Promise<ModelProviderConfig> {
    const config = await this.store.findOwnedById(command.configId, command.viewerUserId);

    if (config === null) {
      throw new ModelProviderApplicationError('not-found', {});
    }

    const now = this.clock.now().getTime();
    const apiKey = {
      id: this.idGenerator.createId(),
      configId: config.id,
      name: command.name.trim(),
      secret: command.secret,
      createdAtMs: now,
      updatedAtMs: now,
    };

    await this.store.addApiKey(apiKey);

    return {
      ...config,
      apiKeys: [...config.apiKeys, apiKey],
    };
  }
}
