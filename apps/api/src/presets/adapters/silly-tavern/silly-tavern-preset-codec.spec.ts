import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDefaultPresetModelSettings } from '../../domain/preset-model-settings.js';
import {
  createDefaultPresetPromptItems,
  withPresetTokenCount,
  type Preset,
} from '../../domain/preset.js';
import { PresetPortError } from '../../ports/preset-port-error.js';
import {
  fromSillyTavernPreset,
  SillyTavernPresetCodec,
  toSillyTavernPreset,
} from './silly-tavern-preset-codec.js';

describe('SillyTavern preset mapper', () => {
  it('imports supported items, reports unknown entries, and supplements missing system items', () => {
    const preset = fromSillyTavernPreset({
      name: 'Partial',
      prompts: [
        {
          identifier: 'main',
          name: 'Main',
          system_prompt: true,
          role: 'system',
          content: 'alpha',
        },
        {
          identifier: 'mystery',
          name: 'Mystery',
          marker: true,
          system_prompt: true,
        },
        {
          identifier: 'custom',
          name: 'Custom',
          system_prompt: false,
          role: 'user',
          content: 'beta',
        },
      ],
      prompt_order: [
        {
          character_id: 100001,
          order: [
            { identifier: 'main', enabled: true },
            { identifier: 'mystery', enabled: true },
            { identifier: 'custom', enabled: false },
          ],
        },
      ],
    });

    expect(preset.promptItems).toHaveLength(13);
    expect(preset.entries).toHaveLength(1);
    expect(preset.issues).toEqual([
      { identifier: 'mystery', name: 'Mystery', reason: 'unknown-marker' },
    ]);
    expect(preset.supplementedItems).toHaveLength(11);
    expect(preset.promptItems.find((item) => item.kind === 'customPrompt')).toMatchObject({
      identifier: 'custom',
    });
  });

  it('imports the default SillyTavern prompt order export without prompt definitions', () => {
    const input = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'test/fixtures/silly-tavern/st_default_presets.json'),
        'utf8',
      ),
    ) as { data: unknown };
    const preset = fromSillyTavernPreset(input.data);

    expect(preset.name).toBe('Untitled preset');
    expect(preset.entries).toHaveLength(0);
    expect(preset.promptItems).toHaveLength(12);
    expect(preset.promptItems.filter((item) => item.enabled)).toHaveLength(11);
    expect(preset.supplementedItems).toEqual([]);
    expect(preset.sourceSnapshot).toBe(input.data);
  });

  it('exports typed system, slot, and custom prompts to SillyTavern fields', () => {
    const promptItems = createDefaultPresetPromptItems(sequentialIdGenerator());
    const preset: Preset = withPresetTokenCount({
      id: 'preset-1',
      ownerUserId: 'user-1',
      visibility: 'private',
      name: 'Exported',
      modelProviderId: null,
      modelSettings: { ...createDefaultPresetModelSettings(), temperature: 0.8 },
      tokenizer: 'cl100k_base',
      entries: [
        {
          id: 'entry-1',
          presetId: 'preset-1',
          identifier: 'custom-1',
          name: 'Custom',
          role: 'user',
          content: 'Custom content',
          placement: { kind: 'inChat', depth: 4, order: 100 },
          generationTypes: ['quiet'],
          tokenCount: 3,
          metadata: { extension: true },
          createdAtMs: 1,
          updatedAtMs: 1,
        },
      ],
      promptItems: [
        ...promptItems,
        {
          id: 'custom-item',
          kind: 'customPrompt',
          entryId: 'entry-1',
          enabled: true,
          orderIndex: promptItems.length,
        },
      ],
      sourceFormat: 'sillytavern_preset',
      sourceSnapshot: {},
      createdAtMs: 1,
      updatedAtMs: 1,
      lastUsedAtMs: null,
      usageCount: 0,
    });

    const output = toSillyTavernPreset(preset);
    const main = output.prompts.find((prompt) => prompt.identifier === 'main');
    const custom = output.prompts.find((prompt) => prompt.identifier === 'custom-1');

    expect(output.name).toBe('Exported');
    expect(output.prompts).toHaveLength(13);
    expect(main).toMatchObject({
      identifier: 'main',
      system_prompt: true,
      forbid_overrides: false,
      injection_position: 0,
    });
    expect(custom).toMatchObject({
      identifier: 'custom-1',
      system_prompt: false,
      injection_position: 1,
      injection_depth: 4,
      injection_trigger: ['quiet'],
      extension: true,
    });
    expect(output.prompt_order[0]?.order).toHaveLength(13);
  });

  it('rejects invalid JSON import files', () => {
    expect(() => new SillyTavernPresetCodec().importFile(Buffer.from('{'))).toThrowError(
      PresetPortError,
    );
  });
});

function sequentialIdGenerator(): () => string {
  let value = 0;
  return () => `item_${++value}`;
}
