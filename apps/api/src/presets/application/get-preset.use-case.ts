import { PresetApplicationError } from './preset-application-error.js';
import type { PresetStore } from './preset-store.js';
import type { Preset } from '../domain/preset.js';

export interface GetPresetCommand {
  id: string;
  viewerUserId: string;
}

export class GetPresetUseCase {
  constructor(private readonly store: PresetStore) {}

  async execute(command: GetPresetCommand): Promise<Preset> {
    const preset = await this.store.findOwnedById(command.id, command.viewerUserId);

    if (preset === null) {
      throw new PresetApplicationError('not-found');
    }

    return preset;
  }
}
