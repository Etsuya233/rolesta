import { ensureEpochMillis } from '../../characters/domain/epoch-millis.js';
import type { PresetClock, PresetIdGenerator } from './preset-application-services.js';
import { PresetApplicationError } from './preset-application-error.js';
import type { PresetStore } from './preset-store.js';
import { withPresetTokenCount, type Preset } from '../domain/preset.js';
import { fromSillyTavernPreset } from '../infrastructure/silly-tavern-preset.mapper.js';

export interface ImportPresetCommand {
  ownerUserId: string;
  fileName: string;
  content: Buffer;
}

export class ImportPresetUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly idGenerator: PresetIdGenerator,
    private readonly clock: PresetClock,
  ) {}

  async execute(command: ImportPresetCommand): Promise<Preset> {
    const input = this.readJson(command.content);
    const imported = fromSillyTavernPreset(input);
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

  private readJson(content: Buffer): unknown {
    try {
      return JSON.parse(content.toString('utf8')) as unknown;
    } catch {
      throw new PresetApplicationError('invalid-import-file');
    }
  }
}
