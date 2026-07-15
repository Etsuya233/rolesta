import { describe, expect, it } from 'vitest';
import { createDefaultPresetModelSettings } from '../domain/preset-model-settings.js';
import type { Preset } from '../domain/preset.js';
import { toPresetDetailResponse } from './preset-responses.dto.js';

describe('preset response mapping', () => {
  it('shows model provider associations only to the preset owner', () => {
    const preset = linkedPreset();

    expect(toPresetDetailResponse(preset, 'owner').modelProviderId).toBe('provider_1');
    expect(toPresetDetailResponse(preset, 'reader').modelProviderId).toBeNull();
  });
});

function linkedPreset(): Preset {
  return {
    id: 'preset_1',
    ownerUserId: 'owner',
    visibility: 'public',
    name: 'Preset',
    modelProviderId: 'provider_1',
    modelSettings: createDefaultPresetModelSettings(),
    tokenizer: 'cl100k_base',
    entries: [],
    promptItems: [],
    tokenCount: 0,
    sourceFormat: 'rolesta',
    sourceSnapshot: {},
    createdAtMs: 1,
    updatedAtMs: 1,
    lastUsedAtMs: null,
    usageCount: 0,
  };
}
