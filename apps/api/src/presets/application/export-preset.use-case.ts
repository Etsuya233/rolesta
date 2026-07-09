import { UseCase } from '../../common/errors/index.js';
import { PresetApplicationError } from './preset-application-error.js';
import { translatePresetError } from './preset-error.mapper.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { PresetCodec } from '../ports/preset-codec.js';

export interface ExportPresetCommand {
  id: string;
  viewerUserId: string;
}

export class ExportPresetUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly codec: PresetCodec,
  ) {}

  @UseCase(translatePresetError)
  async execute(command: ExportPresetCommand): Promise<object> {
    const preset = await this.store.findOwnedById(command.id, command.viewerUserId);

    if (preset === null) {
      throw new PresetApplicationError({
        reason: 'not-found',
        params: {
          presetId: command.id,
        },
      });
    }

    return this.codec.exportPreset(preset);
  }
}
