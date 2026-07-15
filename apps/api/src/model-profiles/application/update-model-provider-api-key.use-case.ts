import { UseCase } from '../../common/errors/index.js';
import type { ApiKey } from '../domain/model-provider-config.js';
import type { ApiKeyStore } from '../ports/api-key-store.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import type { ModelProviderClock } from './model-provider-application-services.js';
import { translateModelProviderError } from './model-provider-error.mapper.js';

export class UpdateModelProviderApiKeyUseCase {
  constructor(
    private readonly store: ApiKeyStore,
    private readonly clock: ModelProviderClock,
  ) {}

  @UseCase(translateModelProviderError)
  async execute(command: {
    apiKeyId: string;
    ownerUserId: string;
    name?: string;
    secret?: string;
  }): Promise<ApiKey> {
    const current = await this.store.findOwnedById(command.apiKeyId, command.ownerUserId);
    if (!current) throw new ModelProviderApplicationError('not-found', {});
    const next = {
      ...current,
      name: command.name === undefined ? current.name : command.name.trim(),
      secret: command.secret === undefined ? current.secret : command.secret,
      updatedAtMs: this.clock.now().getTime(),
    };
    await this.store.update(next);
    return next;
  }
}
