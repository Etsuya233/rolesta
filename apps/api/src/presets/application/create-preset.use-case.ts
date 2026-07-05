import { PROMPT_TOKENIZER } from '@rolesta/shared';
import { ensureEpochMillis } from '../../characters/domain/epoch-millis.js';
import type { PresetClock, PresetIdGenerator } from './preset-application-services.js';
import {
  applyPresetEditableFields,
  type PresetEditableFields,
} from './preset-editable-fields.js';
import type { PresetStore } from './preset-store.js';
import { createDefaultPresetModelSettings } from '../domain/preset-model-settings.js';
import { withPresetTokenCount, type Preset } from '../domain/preset.js';

export interface CreatePresetCommand extends PresetEditableFields {
  ownerUserId: string;
}

export class CreatePresetUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly idGenerator: PresetIdGenerator,
    private readonly clock: PresetClock,
  ) {}

  async execute(command: CreatePresetCommand): Promise<Preset> {
    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const draft = withPresetTokenCount({
      id: this.idGenerator.createId(),
      ownerUserId: command.ownerUserId,
      name: command.name ?? 'Untitled preset',
      modelProviderId: null,
      modelSettings: createDefaultPresetModelSettings(),
      tokenizer: PROMPT_TOKENIZER,
      entries: [],
      promptItems: [],
      sourceFormat: 'rolesta',
      sourceSnapshot: {},
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      lastUsedAtMs: null,
      usageCount: 0,
    });
    const preset = applyPresetEditableFields(draft, command);

    await this.store.save(preset);

    return preset;
  }
}
