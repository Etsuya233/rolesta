import { ModelProviderApplicationError } from './model-provider-application-error.js';
import type { ModelProviderStore } from './model-provider-store.js';

export interface DeleteModelProviderCommand {
  id: string;
  viewerUserId: string;
}

export class DeleteModelProviderUseCase {
  constructor(private readonly store: ModelProviderStore) {}

  async execute(command: DeleteModelProviderCommand): Promise<void> {
    const deleted = await this.store.deleteOwned(command.id, command.viewerUserId);

    if (!deleted) {
      throw new ModelProviderApplicationError('not-found');
    }
  }
}
