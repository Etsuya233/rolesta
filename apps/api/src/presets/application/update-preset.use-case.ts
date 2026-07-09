import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import { PresetApplicationError } from './preset-application-error.js';
import type { PresetClock } from './preset-application-services.js';
import {
  applyPresetEditableFields,
  type PresetEditableFields,
} from './preset-editable-fields.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { Preset } from '../domain/preset.js';

export interface UpdatePresetCommand extends PresetEditableFields {
  id: string;
  viewerUserId: string;
}

export class UpdatePresetUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
  ) {}

  async execute(command: UpdatePresetCommand): Promise<Preset> {
    const current = await this.store.findOwnedById(command.id, command.viewerUserId);

    if (current === null) {
      throw new PresetApplicationError('not-found');
    }

    const updated = applyPresetEditableFields(
      {
        ...current,
        updatedAtMs: ensureEpochMillis(this.clock.now().getTime()),
      },
      command,
    );

    await this.store.update(updated);

    return updated;
  }
}
