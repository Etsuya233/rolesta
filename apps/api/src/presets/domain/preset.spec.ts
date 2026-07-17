import { describe, expect, it } from 'vitest';
import {
  PRESET_DEFAULT_ITEM_ORDER,
  createDefaultPresetPromptItems,
  restorePresetSystemPromptDefault,
  withPresetTokenCount,
  type Preset,
  type PresetEntry,
  type PresetPromptItem,
} from './preset.js';
import { createDefaultPresetModelSettings } from './preset-model-settings.js';

describe('preset prompt model', () => {
  it('creates the complete SillyTavern-compatible default order', () => {
    const items = createDefaultPresetPromptItems(sequentialIdGenerator());

    expect(items.map(systemItemKey)).toEqual(PRESET_DEFAULT_ITEM_ORDER);
    expect(items).toHaveLength(12);
    expect(items.find(isEnhanceDefinitions)).toMatchObject({ enabled: false });
    expect(items.filter((item) => item.enabled)).toHaveLength(11);
  });

  it('counts enabled system and custom prompt content without counting slots', () => {
    const entry: PresetEntry = {
      id: 'entry_1',
      presetId: 'preset_1',
      identifier: 'custom_1',
      name: 'Custom',
      role: 'user',
      content: 'custom content',
      placement: { kind: 'relative' },
      generationTypes: [],
      tokenCount: 7,
      metadata: {},
      createdAtMs: 1,
      updatedAtMs: 1,
    };
    const items = createDefaultPresetPromptItems(sequentialIdGenerator());
    const main = items.find(
      (item) => item.kind === 'systemPrompt' && item.systemPrompt === 'mainPrompt',
    );
    if (!main || main.kind !== 'systemPrompt') {
      throw new Error('Main prompt default is required.');
    }
    const promptItems: PresetPromptItem[] = [
      ...items.map((item) => ({ ...item, enabled: false })),
      {
        id: 'custom_item',
        kind: 'customPrompt',
        entryId: entry.id,
        enabled: true,
        orderIndex: items.length,
      },
    ];
    promptItems[main.orderIndex] = { ...main, enabled: true };

    const preset = withPresetTokenCount(basePreset([entry], promptItems));

    expect(preset.tokenCount).toBe(main.tokenCount + entry.tokenCount);
  });

  it('rejects missing and duplicate system items', () => {
    const items = createDefaultPresetPromptItems(sequentialIdGenerator());

    expect(() => withPresetTokenCount(basePreset([], items.slice(1)))).toThrow(
      'Missing preset system prompt: mainPrompt',
    );
    expect(() =>
      withPresetTokenCount(
        basePreset(
          [],
          [
            ...items,
            {
              ...items[0]!,
              id: 'duplicate_main',
              orderIndex: items.length,
            },
          ],
        ),
      ),
    ).toThrow('Duplicate preset system prompt: mainPrompt');
  });

  it('rejects reserved custom identifiers, duplicate generation types, and invalid placement', () => {
    const items = createDefaultPresetPromptItems(sequentialIdGenerator());
    const reservedEntry: PresetEntry = {
      id: 'entry_1',
      presetId: 'preset_1',
      identifier: 'main',
      name: 'Custom',
      role: 'system',
      content: '',
      placement: { kind: 'relative' },
      generationTypes: [],
      tokenCount: 0,
      metadata: {},
      createdAtMs: 1,
      updatedAtMs: 1,
    };

    expect(() => withPresetTokenCount(basePreset([reservedEntry], items))).toThrow(
      'Preset entry uses reserved identifier: main',
    );

    const main = items.find(
      (item) => item.kind === 'systemPrompt' && item.systemPrompt === 'mainPrompt',
    )!;
    expect(() =>
      withPresetTokenCount(
        basePreset(
          [],
          items.map((item) =>
            item.id === main.id ? { ...main, generationTypes: ['normal', 'normal'] } : item,
          ),
        ),
      ),
    ).toThrow('Preset prompt generation types must be unique.');
    expect(() =>
      withPresetTokenCount(
        basePreset(
          [],
          items.map((item) =>
            item.id === main.id
              ? { ...main, placement: { kind: 'inChat', depth: 1.5, order: 100 } }
              : item,
          ),
        ),
      ),
    ).toThrow('In-chat preset prompt placement requires an integer depth and order.');
  });

  it('restores the complete current system prompt default', () => {
    const item = createDefaultPresetPromptItems(sequentialIdGenerator()).find(
      (candidate) => candidate.kind === 'systemPrompt' && candidate.systemPrompt === 'mainPrompt',
    )!;
    if (item.kind !== 'systemPrompt') {
      throw new Error('Main prompt default is required.');
    }

    expect(
      restorePresetSystemPromptDefault({
        ...item,
        name: 'Edited',
        role: 'assistant',
        content: 'Edited',
        placement: { kind: 'inChat', depth: 4, order: 100 },
        generationTypes: ['quiet'],
        allowCharacterOverride: false,
        tokenCount: 1,
        enabled: false,
      }),
    ).toMatchObject({
      name: 'Main Prompt',
      role: 'system',
      placement: { kind: 'relative' },
      generationTypes: [],
      allowCharacterOverride: true,
      enabled: true,
    });
  });
});

function basePreset(
  entries: PresetEntry[],
  promptItems: PresetPromptItem[],
): Omit<Preset, 'tokenCount'> {
  return {
    id: 'preset_1',
    ownerUserId: 'owner',
    visibility: 'private',
    name: 'Preset',
    modelProviderId: null,
    modelSettings: createDefaultPresetModelSettings(),
    tokenizer: 'cl100k_base',
    entries,
    promptItems,
    sourceFormat: 'rolesta',
    sourceSnapshot: {},
    createdAtMs: 1,
    updatedAtMs: 1,
    lastUsedAtMs: null,
    usageCount: 0,
  };
}

function sequentialIdGenerator(): () => string {
  let value = 0;
  return () => `item_${++value}`;
}

function systemItemKey(item: PresetPromptItem): string {
  if (item.kind === 'systemPrompt') {
    return item.systemPrompt;
  }
  if (item.kind === 'slot') {
    return item.slot;
  }
  return item.entryId;
}

function isEnhanceDefinitions(item: PresetPromptItem): boolean {
  return item.kind === 'systemPrompt' && item.systemPrompt === 'enhanceDefinitions';
}
