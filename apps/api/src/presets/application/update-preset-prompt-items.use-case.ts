import { ensureEpochMillis } from '../../characters/domain/epoch-millis.js';
import { PresetApplicationError } from './preset-application-error.js';
import type { PresetClock } from './preset-application-services.js';
import type { PresetStore } from './preset-store.js';
import type { Preset, PresetPromptItem } from '../domain/preset.js';
import { withPresetTokenCount } from '../domain/preset.js';

export interface UpdatePresetPromptItemsCommand {
  presetId: string;
  viewerUserId: string;
  items: Array<{
    entryId: string;
    enabled: boolean;
  }>;
}

export class UpdatePresetPromptItemsUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
  ) {}

  async execute(command: UpdatePresetPromptItemsCommand): Promise<Preset> {
    const current = await this.store.findOwnedById(command.presetId, command.viewerUserId);

    if (current === null) {
      throw new PresetApplicationError('not-found');
    }

    const entryIds = new Set<string>();

    for (const item of command.items) {
      if (entryIds.has(item.entryId)) {
        throw new PresetApplicationError('duplicate-entry');
      }

      entryIds.add(item.entryId);

      if (!current.entries.some((entry) => entry.id === item.entryId)) {
        throw new PresetApplicationError('unknown-entry');
      }
    }

    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const promptItems: PresetPromptItem[] = command.items.map((item, index) => ({
      entryId: item.entryId,
      enabled: item.enabled,
      orderIndex: index,
    }));
    const updated = withPresetTokenCount({
      ...current,
      promptItems,
      updatedAtMs: nowMs,
    });

    await this.store.update(updated);

    return updated;
  }
}
