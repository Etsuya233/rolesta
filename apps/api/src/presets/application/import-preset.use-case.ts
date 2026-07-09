import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { PresetClock, PresetIdGenerator } from './preset-application-services.js';
import { PresetApplicationError } from './preset-application-error.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { PresetCodec } from '../ports/preset-codec.js';
import { withPresetTokenCount, type Preset } from '../domain/preset.js';

export interface ImportPresetCommand {
  ownerUserId: string;
  content: Buffer;
}

export class ImportPresetUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly codec: PresetCodec,
    private readonly idGenerator: PresetIdGenerator,
    private readonly clock: PresetClock,
  ) {}

  async execute(command: ImportPresetCommand): Promise<Preset> {
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
    const promptItems = imported.promptItems.map((item) => {
      const entry = entries.find((candidate) => candidate.identifier === item.identifier);

      if (entry === undefined) {
        throw new PresetApplicationError('unknown-entry');
      }

      return {
        entryId: entry.id,
        enabled: item.enabled,
        orderIndex: item.orderIndex,
      };
    });
    const preset = withPresetTokenCount({
      id: presetId,
      ownerUserId: command.ownerUserId,
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

    await this.store.save(preset);

    return preset;
  }
}
