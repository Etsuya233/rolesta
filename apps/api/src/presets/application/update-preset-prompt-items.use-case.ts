import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import { PresetApplicationError } from './preset-application-error.js';
import { translatePresetError } from './preset-error.mapper.js';
import type { PresetClock } from './preset-application-services.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { Preset, PresetPromptItem } from '../domain/preset.js';
import { withPresetTokenCount } from '../domain/preset.js';

export interface UpdatePresetPromptItemsCommand {
  presetId: string;
  viewerUserId: string;
  items: Array<{
    id: string;
    enabled: boolean;
  }>;
}

export class UpdatePresetPromptItemsUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translatePresetError)
  async execute(command: UpdatePresetPromptItemsCommand): Promise<Preset> {
    return this.unitOfWork.run(async () => {
      const current = await this.store.findOwnedById(command.presetId, command.viewerUserId);

      if (current === null) {
        throw new PresetApplicationError({
          reason: 'not-found',
          params: {
            presetId: command.presetId,
          },
        });
      }

      const itemIds = new Set<string>();

      for (const item of command.items) {
        if (itemIds.has(item.id)) {
          throw new PresetApplicationError({
            reason: 'duplicate-entry',
            params: {
              presetId: command.presetId,
              entryId: item.id,
            },
          });
        }

        itemIds.add(item.id);

        if (!current.promptItems.some((candidate) => candidate.id === item.id)) {
          throw new PresetApplicationError({
            reason: 'unknown-entry',
            params: {
              presetId: command.presetId,
              entryId: item.id,
            },
          });
        }
      }

      const nowMs = ensureEpochMillis(this.clock.now().getTime());
      const currentItemById = new Map(current.promptItems.map((item) => [item.id, item]));
      const promptItems: PresetPromptItem[] = command.items.map((item, orderIndex) => ({
        ...currentItemById.get(item.id)!,
        enabled: item.enabled,
        orderIndex,
      }));
      let updated: Preset;
      try {
        updated = withPresetTokenCount({
          ...current,
          promptItems,
          updatedAtMs: nowMs,
        });
      } catch (error) {
        throw new PresetApplicationError({
          reason: 'invalid-preset',
          params: { field: 'promptItems' },
          cause: error,
        });
      }

      await this.store.update(updated);

      return updated;
    });
  }
}
