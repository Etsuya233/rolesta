import { ensureEpochMillis } from '../../characters/domain/epoch-millis.js';
import { PresetApplicationError } from './preset-application-error.js';
import type { PresetClock } from './preset-application-services.js';
import type { PresetStore } from './preset-store.js';
import type { Preset } from '../domain/preset.js';
import { withPresetTokenCount } from '../domain/preset.js';

export interface DeletePresetEntryCommand {
  presetId: string;
  entryId: string;
  viewerUserId: string;
}

export class DeletePresetEntryUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
  ) {}

  async execute(command: DeletePresetEntryCommand): Promise<Preset> {
    const current = await this.store.findOwnedById(command.presetId, command.viewerUserId);

    if (current === null) {
      throw new PresetApplicationError('not-found');
    }

    if (!current.entries.some((entry) => entry.id === command.entryId)) {
      throw new PresetApplicationError('unknown-entry');
    }

    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const remainingItems = current.promptItems
      .filter((item) => item.entryId !== command.entryId)
      .map((item, index) => ({ ...item, orderIndex: index }));
    const updated = withPresetTokenCount({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== command.entryId),
      promptItems: remainingItems,
      updatedAtMs: nowMs,
    });

    await this.store.update(updated);

    return updated;
  }
}
