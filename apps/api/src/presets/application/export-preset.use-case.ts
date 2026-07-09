import { PresetApplicationError } from './preset-application-error.js';
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

  async execute(command: ExportPresetCommand): Promise<object> {
    const preset = await this.store.findOwnedById(command.id, command.viewerUserId);

    if (preset === null) {
      throw new PresetApplicationError('not-found');
    }

    return this.codec.exportPreset(preset);
  }
}
