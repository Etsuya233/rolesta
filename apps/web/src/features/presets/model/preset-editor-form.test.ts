import { describe, expect, it } from 'vitest';
import type { PresetDetailResponse } from '../api/presets-api';
import { presetDocumentEquals, presetDocumentFromDetail } from './preset-editor-form';

describe('preset editor form', () => {
  it('hydrates the model connection and includes it in dirty comparison', () => {
    const document = presetDocumentFromDetail(presetDetail());

    expect(document.modelProviderId).toBe('provider_1');
    expect(presetDocumentEquals(document, { ...document, modelProviderId: null })).toBe(false);
  });
});

function presetDetail(): PresetDetailResponse {
  return {
    id: 'preset_1',
    ownerUserId: 'owner',
    visibility: 'private',
    name: 'Preset',
    entryCount: 0,
    promptItemCount: 0,
    tokenCount: 0,
    createdAtMs: 1,
    updatedAtMs: 1,
    lastUsedAtMs: null,
    usageCount: 0,
    modelProviderId: 'provider_1',
    modelSettings: {
      contextLength: null,
      maxResponseLength: null,
      stream: true,
      temperature: null,
      presencePenalty: null,
      frequencyPenalty: null,
      repetitionPenalty: null,
      topP: null,
      topK: null,
      minP: null,
      topA: null,
      seed: null,
      n: null,
      reasoningEffort: '',
      verbosity: '',
      showThoughts: false,
    },
    tokenizer: 'cl100k_base',
    sourceFormat: 'rolesta',
    entries: [],
    promptItems: [],
  };
}
