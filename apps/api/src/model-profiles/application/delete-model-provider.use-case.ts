import { UseCase } from '../../common/errors/index.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import { translateModelProviderError } from './model-provider-error.mapper.js';
import type { ModelProviderStore } from '../ports/model-provider-store.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';

export interface DeleteModelProviderCommand {
  id: string;
  viewerUserId: string;
}

export class DeleteModelProviderUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateModelProviderError)
  async execute(command: DeleteModelProviderCommand): Promise<void> {
    // FIXME: Publish ModelProviderDeleted and let the presets context clear links.
    const deleted = await this.unitOfWork.run(() =>
      this.store.deleteOwned(command.id, command.viewerUserId),
    );

    if (!deleted) {
      throw new ModelProviderApplicationError('not-found', {});
    }
  }
}
