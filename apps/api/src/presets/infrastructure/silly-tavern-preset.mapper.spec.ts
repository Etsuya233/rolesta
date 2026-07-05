import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Preset } from '../domain/preset.js';
import {
  fromSillyTavernPreset,
  toSillyTavernPreset,
} from './silly-tavern-preset.mapper.js';

describe('SillyTavern preset mapper', () => {
  it('imports the sample preset with the default character order', () => {
    const input = JSON.parse(
      readFileSync(
        resolve(process.cwd(), '../../tmp/Preset-Ako1.86-VintageNovel-4.json'),
        'utf8',
      ),
    ) as unknown;
    const preset = fromSillyTavernPreset(input);

    expect(preset.name).toBe('Ako1.86-VintageNovel (1)');
    expect(preset.entries).toHaveLength(271);
    expect(preset.promptItems).toHaveLength(11);
    expect(preset.promptItems[0]).toMatchObject({
      identifier: 'main',
      enabled: true,
      orderIndex: 0,
    });
    expect(preset.modelSettings.contextLength).toBe(2000000);
    expect(preset.modelSettings.maxResponseLength).toBe(65535);
    expect(preset.sourceSnapshot).toBe(input);
    expect(preset.entries[0]?.tokenCount).toBeGreaterThan(0);
  });

  it('uses the first prompt order when the default character order is absent', () => {
    const preset = fromSillyTavernPreset({
      name: 'fallback order',
      prompts: [
        { identifier: 'a', name: 'A', role: 'system', content: 'alpha' },
        { identifier: 'b', name: 'B', role: 'user', content: 'beta' },
      ],
      prompt_order: [
        {
          character_id: 42,
          order: [{ identifier: 'b', enabled: true }],
        },
      ],
    });

    expect(preset.promptItems).toEqual([
      { identifier: 'b', enabled: true, orderIndex: 0 },
    ]);
  });

  it('keeps the default stream setting when stream_openai is absent', () => {
    const preset = fromSillyTavernPreset({
      name: 'missing stream',
      prompts: [{ identifier: 'main', name: 'Main', role: 'system', content: 'alpha' }],
      prompt_order: [
        {
          character_id: 100000,
          order: [{ identifier: 'main', enabled: true }],
        },
      ],
    });

    expect(preset.modelSettings.stream).toBe(true);
  });

  it('exports only the Rolesta aggregate fields', () => {
    const preset: Preset = {
      id: 'preset-1',
      ownerUserId: 'user-1',
      name: 'Exported',
      modelProviderId: null,
      modelSettings: {
        contextLength: 100,
        maxResponseLength: 20,
        stream: true,
        temperature: 0.8,
        presencePenalty: null,
        frequencyPenalty: null,
        repetitionPenalty: null,
        topP: 0.9,
        topK: 40,
        minP: null,
        topA: null,
        seed: null,
        n: null,
        reasoningEffort: '',
        verbosity: '',
        showThoughts: false,
      },
      tokenizer: 'cl100k_base',
      entries: [
        {
          id: 'entry-1',
          presetId: 'preset-1',
          identifier: 'main',
          name: 'Main',
          role: 'system',
          position: 'system',
          content: 'Write clearly.',
          tokenCount: 3,
          metadata: { forbid_overrides: false },
          createdAtMs: 1,
          updatedAtMs: 1,
        },
      ],
      promptItems: [{ entryId: 'entry-1', enabled: true, orderIndex: 0 }],
      tokenCount: 3,
      sourceFormat: 'sillytavern_preset',
      sourceSnapshot: { provider_only: 'ignored' },
      createdAtMs: 1,
      updatedAtMs: 1,
      lastUsedAtMs: null,
      usageCount: 0,
    };

    const output = toSillyTavernPreset(preset);

    expect(output.name).toBe('Exported');
    expect(output.prompts).toHaveLength(1);
    expect(output.prompts[0]).toMatchObject({
      identifier: 'main',
      forbid_overrides: false,
    });
    expect(output.prompt_order).toEqual([
      {
        character_id: 100000,
        order: [{ identifier: 'main', enabled: true }],
      },
    ]);
    expect(output).not.toHaveProperty('provider_only');
  });
});
