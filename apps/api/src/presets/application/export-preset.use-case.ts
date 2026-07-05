import { PresetApplicationError } from './preset-application-error.js';
import type { PresetStore } from './preset-store.js';
import {
  toSillyTavernPreset,
  type SillyTavernPresetOutput,
} from '../infrastructure/silly-tavern-preset.mapper.js';

export interface ExportPresetCommand {
  id: string;
  viewerUserId: string;
}

export class ExportPresetUseCase {
  constructor(private readonly store: PresetStore) {}

  async execute(command: ExportPresetCommand): Promise<SillyTavernPresetOutput> {
    const preset = await this.store.findOwnedById(command.id, command.viewerUserId);

    if (preset === null) {
      throw new PresetApplicationError('not-found');
    }

    return toSillyTavernPreset(preset);
  }
}
