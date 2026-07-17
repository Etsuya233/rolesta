import { describe, expect, it } from 'vitest';
import type { PresetDetailResponse } from '../api/presets-api';
import { presetDocumentEquals, presetDocumentFromDetail } from './preset-editor-form';
import { restoreSystemPromptDefault } from './preset-system-prompt-defaults';

describe('preset editor form', () => {
  it('hydrates the model connection and includes it in dirty comparison', () => {
    const document = presetDocumentFromDetail(presetDetail());

    expect(document.modelProviderId).toBe('provider_1');
    expect(presetDocumentEquals(document, { ...document, modelProviderId: null })).toBe(false);
  });

  it('converts all three prompt item kinds into the editable document', () => {
    const detail = presetDetail();
    detail.entries = [
      {
        id: 'entry_1',
        presetId: detail.id,
        identifier: 'custom_1',
        name: 'Custom',
        role: 'user',
        content: 'custom',
        placement: { kind: 'inChat', depth: 4, order: 100 },
        generationTypes: ['quiet'],
        tokenCount: 1,
        metadata: {},
        createdAtMs: 1,
        updatedAtMs: 1,
      },
    ];
    detail.promptItems = [
      {
        id: 'history',
        kind: 'slot',
        slot: 'chatHistory',
        enabled: true,
        orderIndex: 2,
      },
      {
        id: 'main',
        kind: 'systemPrompt',
        systemPrompt: 'mainPrompt',
        name: 'Main',
        role: 'system',
        content: 'main',
        placement: { kind: 'relative' },
        generationTypes: [],
        allowCharacterOverride: true,
        tokenCount: 1,
        enabled: true,
        orderIndex: 0,
      },
      {
        id: 'custom_item',
        kind: 'customPrompt',
        entryId: 'entry_1',
        enabled: false,
        orderIndex: 1,
      },
    ];

    const document = presetDocumentFromDetail(detail);

    expect(document.promptItems.map((item) => item.kind)).toEqual([
      'systemPrompt',
      'customPrompt',
      'slot',
    ]);
    expect(document.entries[0]).toMatchObject({
      placement: { kind: 'inChat', depth: 4, order: 100 },
      generationTypes: ['quiet'],
    });
  });

  it('restores the complete main prompt default in the Web draft', () => {
    const item = {
      id: 'main',
      kind: 'systemPrompt' as const,
      systemPrompt: 'mainPrompt' as const,
      name: 'Edited',
      role: 'assistant' as const,
      content: 'edited',
      placement: { kind: 'inChat' as const, depth: 9, order: 1 },
      generationTypes: ['quiet' as const],
      allowCharacterOverride: false,
      enabled: false,
    };

    expect(restoreSystemPromptDefault(item)).toMatchObject({
      id: 'main',
      name: 'Main Prompt',
      role: 'system',
      placement: { kind: 'relative' },
      generationTypes: [],
      allowCharacterOverride: true,
      enabled: true,
    });
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
