import { UseCase } from '../../common/errors/index.js';
import { translatePresetError } from './preset-error.mapper.js';
import { PresetApplicationError } from './preset-application-error.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { Preset } from '../domain/preset.js';

export interface GetPresetCommand {
  id: string;
  viewerUserId: string;
}

export class GetPresetUseCase {
  constructor(private readonly store: PresetStore) {}

  @UseCase(translatePresetError)
  async execute(command: GetPresetCommand): Promise<Preset> {
    const preset = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (preset === null) {
      throw new PresetApplicationError({
        reason: 'not-found',
        params: {
          presetId: command.id,
        },
      });
    }

    return preset;
  }
}
