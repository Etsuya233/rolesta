import { UseCase } from '../../common/errors/index.js';
import type { ModelProviderConfig } from '../domain/model-provider-config.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import { translateModelProviderError } from './model-provider-error.mapper.js';
import type { ModelProviderStore } from '../ports/model-provider-store.js';

export interface GetModelProviderCommand {
  id: string;
  viewerUserId: string;
}

export class GetModelProviderUseCase {
  constructor(private readonly store: ModelProviderStore) {}

  @UseCase(translateModelProviderError)
  async execute(command: GetModelProviderCommand): Promise<ModelProviderConfig> {
    const config = await this.store.findOwnedById(command.id, command.viewerUserId);

    if (config === null) {
      throw new ModelProviderApplicationError('not-found', {});
    }

    return config;
  }
}
