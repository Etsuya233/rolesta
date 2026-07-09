import { PresetApplicationError } from './preset-application-error.js';
import type { PresetStore } from '../ports/preset-store.js';

export interface DeletePresetCommand {
  id: string;
  viewerUserId: string;
}

export class DeletePresetUseCase {
  constructor(private readonly store: PresetStore) {}

  async execute(command: DeletePresetCommand): Promise<void> {
    const deleted = await this.store.deleteOwned(command.id, command.viewerUserId);

    if (!deleted) {
      throw new PresetApplicationError('not-found');
    }
  }
}
