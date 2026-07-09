import { UseCase } from '../../common/errors/index.js';
import { countPromptTokens } from '@rolesta/shared';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import { PresetApplicationError } from './preset-application-error.js';
import { translatePresetError } from './preset-error.mapper.js';
import type { PresetClock } from './preset-application-services.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { Preset, PresetEntryPosition, PresetEntryRole } from '../domain/preset.js';
import { withPresetTokenCount } from '../domain/preset.js';

export interface UpdatePresetEntryCommand {
  presetId: string;
  entryId: string;
  viewerUserId: string;
  name?: string;
  role?: PresetEntryRole;
  position?: PresetEntryPosition;
  content?: string;
}

export class UpdatePresetEntryUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
  ) {}

  @UseCase(translatePresetError)
  async execute(command: UpdatePresetEntryCommand): Promise<Preset> {
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
    const updated = withPresetTokenCount({
      ...current,
      entries: current.entries.map((entry) => {
        if (entry.id !== command.entryId) {
          return entry;
        }

        const content = command.content ?? entry.content;

        return {
          ...entry,
          name: command.name ?? entry.name,
          role: command.role ?? entry.role,
          position: command.position ?? entry.position,
          content,
          tokenCount: countPromptTokens(content),
          updatedAtMs: nowMs,
        };
      }),
      updatedAtMs: nowMs,
    });

    await this.store.update(updated);

    return updated;
  }
}
