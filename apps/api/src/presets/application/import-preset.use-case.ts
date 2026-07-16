import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { PresetClock, PresetIdGenerator } from './preset-application-services.js';
import { PresetApplicationError } from './preset-application-error.js';
import { translatePresetError } from './preset-error.mapper.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { PresetCodec } from '../ports/preset-codec.js';
import { withPresetTokenCount, type Preset, type PresetPromptItem } from '../domain/preset.js';

export interface ImportPresetCommand {
  ownerUserId: string;
  content: Buffer;
}

export interface ImportPresetResult {
  preset: Preset;
  issues: ReturnType<PresetCodec['importFile']>['issues'];
  supplementedItems: ReturnType<PresetCodec['importFile']>['supplementedItems'];
}

export class ImportPresetUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly codec: PresetCodec,
    private readonly idGenerator: PresetIdGenerator,
    private readonly clock: PresetClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translatePresetError)
  async execute(command: ImportPresetCommand): Promise<ImportPresetResult> {
    const imported = this.codec.importFile(command.content);
    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const presetId = this.idGenerator.createId();
    const entries = imported.entries.map((entry) => ({
      ...entry,
      id: this.idGenerator.createId(),
      presetId,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    }));
    const entryByIdentifier = new Map(entries.map((entry) => [entry.identifier, entry]));
    const promptItems: PresetPromptItem[] = [];

    for (const item of imported.promptItems) {
      if (item.kind === 'customPrompt') {
        const entry = entryByIdentifier.get(item.identifier);
        if (!entry) {
          throw new PresetApplicationError({
            reason: 'unknown-entry',
            params: { presetId, identifier: item.identifier },
          });
        }
        promptItems.push({
          id: this.idGenerator.createId(),
          kind: item.kind,
          entryId: entry.id,
          enabled: item.enabled,
          orderIndex: item.orderIndex,
        });
        continue;
      }

      promptItems.push({
        ...item,
        id: this.idGenerator.createId(),
      });
    }

    const preset = withPresetTokenCount({
      id: presetId,
      ownerUserId: command.ownerUserId,
      visibility: 'private',
      name: imported.name,
      modelProviderId: null,
      modelSettings: imported.modelSettings,
      tokenizer: imported.tokenizer,
      entries,
      promptItems,
      sourceFormat: 'sillytavern_preset',
      sourceSnapshot: imported.sourceSnapshot,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      lastUsedAtMs: null,
      usageCount: 0,
    });

    await this.unitOfWork.run(() => this.store.save(preset));

    return {
      preset,
      issues: imported.issues,
      supplementedItems: imported.supplementedItems,
    };
  }
}
