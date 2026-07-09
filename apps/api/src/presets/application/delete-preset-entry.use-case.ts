import { UseCase } from '../../common/errors/index.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import { PresetApplicationError } from './preset-application-error.js';
import { translatePresetError } from './preset-error.mapper.js';
import type { PresetClock } from './preset-application-services.js';
import type { PresetStore } from '../ports/preset-store.js';
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

  @UseCase(translatePresetError)
  async execute(command: DeletePresetEntryCommand): Promise<Preset> {
    const current = await this.store.findOwnedById(command.presetId, command.viewerUserId);

    if (current === null) {
      throw new PresetApplicationError({
        reason: 'not-found',
        params: {
          presetId: command.presetId,
        },
      });
    }

    if (!current.entries.some((entry) => entry.id === command.entryId)) {
      throw new PresetApplicationError({
        reason: 'unknown-entry',
        params: {
          presetId: command.presetId,
          entryId: command.entryId,
        },
      });
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
