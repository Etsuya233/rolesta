import { countPromptTokens } from '@rolesta/shared';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import { PresetApplicationError } from './preset-application-error.js';
import type { PresetClock, PresetIdGenerator } from './preset-application-services.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { Preset, PresetEntryPosition, PresetEntryRole } from '../domain/preset.js';
import { withPresetTokenCount } from '../domain/preset.js';

export interface CreatePresetEntryCommand {
  presetId: string;
  viewerUserId: string;
  name: string;
  role: PresetEntryRole;
  position: PresetEntryPosition;
  content: string;
}

export class CreatePresetEntryUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly idGenerator: PresetIdGenerator,
    private readonly clock: PresetClock,
  ) {}

  async execute(command: CreatePresetEntryCommand): Promise<Preset> {
    const current = await this.store.findOwnedById(command.presetId, command.viewerUserId);

    if (current === null) {
      throw new PresetApplicationError('not-found');
    }

    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const entryId = this.idGenerator.createId();
    const updated = withPresetTokenCount({
      ...current,
      entries: [
        ...current.entries,
        {
          id: entryId,
          presetId: current.id,
          identifier: entryId,
          name: command.name,
          role: command.role,
          position: command.position,
          content: command.content,
          tokenCount: countPromptTokens(command.content),
          metadata: {},
          createdAtMs: nowMs,
          updatedAtMs: nowMs,
        },
      ],
      promptItems: [
        ...current.promptItems,
        {
          entryId,
          enabled: true,
          orderIndex: current.promptItems.length,
        },
      ],
      updatedAtMs: nowMs,
    });

    await this.store.update(updated);

    return updated;
  }
}
