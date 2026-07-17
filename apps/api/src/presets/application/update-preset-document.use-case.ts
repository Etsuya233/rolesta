import { countPromptTokens } from '@rolesta/shared';
import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import type { DomainEventPublisher } from '../../common/events/index.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import {
  isReservedPresetIdentifier,
  withPresetTokenCount,
  type Preset,
  type PresetEntryRole,
  type PresetGenerationType,
  type PresetPromptItem,
  type PresetPromptPlacement,
  type PresetVisibility,
} from '../domain/preset.js';
import type { PresetModelSettings } from '../domain/preset-model-settings.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { PresetModelProviderAccess } from '../ports/preset-model-provider-access.js';
import { PresetVisibilityChangedEvent } from '../events/index.js';
import type { PresetClock } from './preset-application-services.js';
import { PresetApplicationError } from './preset-application-error.js';
import { translatePresetError } from './preset-error.mapper.js';

export interface PresetDocumentEntry {
  id: string;
  name: string;
  role: PresetEntryRole;
  content: string;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
}

export interface UpdatePresetDocumentCommand {
  presetId: string;
  viewerUserId: string;
  visibility: PresetVisibility;
  name: string;
  modelProviderId: string | null;
  modelSettings: PresetModelSettings;
  entries: PresetDocumentEntry[];
  promptItems: PresetPromptItem[];
}

export class UpdatePresetDocumentUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
    private readonly modelProviderAccess: PresetModelProviderAccess,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: DomainEventPublisher,
  ) {}

  @UseCase(translatePresetError)
  async execute(command: UpdatePresetDocumentCommand): Promise<Preset> {
    return this.unitOfWork.run(async () => {
      const current = await this.store.findOwnedById(command.presetId, command.viewerUserId);

      if (current === null) {
        throw new PresetApplicationError({
          reason: 'not-found',
          params: { presetId: command.presetId },
        });
      }

      assertUniqueEntryIds(command.presetId, command.entries);
      assertStableSystemItemIds(current, command.promptItems);

      if (
        command.modelProviderId !== null &&
        !(await this.modelProviderAccess.acquireOwned(command.modelProviderId, current.ownerUserId))
      ) {
        throw new PresetApplicationError({
          reason: 'model-provider-unavailable',
          params: { modelProviderId: command.modelProviderId },
        });
      }

      const nowMs = ensureEpochMillis(this.clock.now().getTime());
      const currentEntryById = new Map(current.entries.map((entry) => [entry.id, entry]));
      const entries = command.entries.map((entry) => {
        const existing = currentEntryById.get(entry.id);
        const identifier = existing?.identifier ?? entry.id;

        if (isReservedPresetIdentifier(identifier)) {
          throw new PresetApplicationError({
            reason: 'invalid-preset',
            params: { field: 'entries.identifier' },
          });
        }

        return {
          id: entry.id,
          presetId: current.id,
          identifier,
          name: entry.name,
          role: entry.role,
          content: entry.content,
          placement: entry.placement,
          generationTypes: entry.generationTypes,
          tokenCount: countPromptTokens(entry.content),
          metadata: existing?.metadata ?? {},
          createdAtMs: existing?.createdAtMs ?? nowMs,
          updatedAtMs: nowMs,
        };
      });
      let updated: Preset;

      try {
        updated = withPresetTokenCount({
          ...current,
          visibility: command.visibility,
          name: command.name,
          modelProviderId: command.modelProviderId,
          modelSettings: command.modelSettings,
          entries,
          promptItems: command.promptItems.map((item, orderIndex) => ({
            ...item,
            orderIndex,
            ...(item.kind === 'systemPrompt'
              ? { tokenCount: countPromptTokens(item.content) }
              : {}),
          })),
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
      await this.store.updateModelProviderAssociation(
        current.id,
        current.ownerUserId,
        command.modelProviderId,
      );
      if (current.visibility === 'public' && updated.visibility === 'private') {
        await this.events.publish(
          new PresetVisibilityChangedEvent({
            presetId: current.id,
            ownerUserId: current.ownerUserId,
            occurredAtMs: nowMs,
          }),
        );
      }
      return updated;
    });
  }
}

function assertUniqueEntryIds(presetId: string, entries: PresetDocumentEntry[]): void {
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

function assertStableSystemItemIds(current: Preset, promptItems: PresetPromptItem[]): void {
  const currentSystemItemById = new Map(
    current.promptItems
      .filter((item) => item.kind !== 'customPrompt')
      .map((item) => [item.id, item]),
  );

  for (const item of promptItems) {
    if (item.kind === 'customPrompt') {
      continue;
    }

    const currentItem = currentSystemItemById.get(item.id);
    const sameSystemKey =
      currentItem !== undefined &&
      ((item.kind === 'systemPrompt' &&
        currentItem.kind === 'systemPrompt' &&
        currentItem.systemPrompt === item.systemPrompt) ||
        (item.kind === 'slot' && currentItem.kind === 'slot' && currentItem.slot === item.slot));

    if (!sameSystemKey) {
      throw new PresetApplicationError({
        reason: 'invalid-preset',
        params: { field: 'promptItems.id' },
      });
    }
  }
}
