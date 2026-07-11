import { countPromptTokens } from '@rolesta/shared';
import { UseCase } from '../../common/errors/index.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import {
  withPresetTokenCount,
  type Preset,
  type PresetEntryPosition,
  type PresetEntryRole,
  type PresetVisibility,
} from '../domain/preset.js';
import type { PresetModelSettings } from '../domain/preset-model-settings.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { PresetClock } from './preset-application-services.js';
import { PresetApplicationError } from './preset-application-error.js';
import { translatePresetError } from './preset-error.mapper.js';

export interface PresetDocumentEntry {
  id: string;
  name: string;
  role: PresetEntryRole;
  position: PresetEntryPosition;
  content: string;
}

export interface PresetDocumentPromptItem {
  entryId: string;
  enabled: boolean;
}

export interface UpdatePresetDocumentCommand {
  presetId: string;
  viewerUserId: string;
  visibility: PresetVisibility;
  name: string;
  modelSettings: PresetModelSettings;
  entries: PresetDocumentEntry[];
  promptItems: PresetDocumentPromptItem[];
}

export class UpdatePresetDocumentUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
  ) {}

  @UseCase(translatePresetError)
  async execute(command: UpdatePresetDocumentCommand): Promise<Preset> {
    const current = await this.store.findOwnedById(
      command.presetId,
      command.viewerUserId,
    );

    if (current === null) {
      throw new PresetApplicationError({
        reason: 'not-found',
        params: { presetId: command.presetId },
      });
    }

    assertUniqueEntryIds(command.presetId, command.entries);
    assertValidPromptItems(
      command.presetId,
      command.entries,
      command.promptItems,
    );

    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const currentEntryById = new Map(
      current.entries.map((entry) => [entry.id, entry]),
    );
    const entries = command.entries.map((entry) => {
      const existing = currentEntryById.get(entry.id);

      return {
        id: entry.id,
        presetId: current.id,
        identifier: existing?.identifier ?? entry.id,
        name: entry.name,
        role: entry.role,
        position: entry.position,
        content: entry.content,
        tokenCount: countPromptTokens(entry.content),
        metadata: existing?.metadata ?? {},
        createdAtMs: existing?.createdAtMs ?? nowMs,
        updatedAtMs: nowMs,
      };
    });
    const updated = withPresetTokenCount({
      ...current,
      visibility: command.visibility,
      name: command.name,
      modelSettings: command.modelSettings,
      entries,
      promptItems: command.promptItems.map((item, orderIndex) => ({
        entryId: item.entryId,
        enabled: item.enabled,
        orderIndex,
      })),
      updatedAtMs: nowMs,
    });

    await this.store.update(updated);
    return updated;
  }
}

function assertUniqueEntryIds(
  presetId: string,
  entries: PresetDocumentEntry[],
): void {
  const entryIds = new Set<string>();

  for (const entry of entries) {
    if (entryIds.has(entry.id)) {
      throw new PresetApplicationError({
        reason: 'duplicate-entry',
        params: { presetId, entryId: entry.id },
      });
    }

    entryIds.add(entry.id);
  }
}

function assertValidPromptItems(
  presetId: string,
  entries: PresetDocumentEntry[],
  promptItems: PresetDocumentPromptItem[],
): void {
  const knownEntryIds = new Set(entries.map((entry) => entry.id));
  const linkedEntryIds = new Set<string>();

  for (const item of promptItems) {
    if (linkedEntryIds.has(item.entryId)) {
      throw new PresetApplicationError({
        reason: 'duplicate-entry',
        params: { presetId, entryId: item.entryId },
      });
    }

    if (!knownEntryIds.has(item.entryId)) {
      throw new PresetApplicationError({
        reason: 'unknown-entry',
        params: { presetId, entryId: item.entryId },
      });
    }

    linkedEntryIds.add(item.entryId);
  }
}
