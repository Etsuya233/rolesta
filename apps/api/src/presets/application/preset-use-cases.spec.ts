import { describe, expect, it } from 'vitest';
import type { PageResponse } from '@rolesta/shared';
import { PresetApplicationError } from './preset-application-error.js';
import { ImportPresetUseCase } from './import-preset.use-case.js';
import { UpdatePresetPromptItemsUseCase } from './update-preset-prompt-items.use-case.js';
import { UpdatePresetDocumentUseCase } from './update-preset-document.use-case.js';
import type {
  PresetClock,
  PresetIdGenerator,
} from './preset-application-services.js';
import type { Preset, PresetSummary } from '../domain/preset.js';
import type { PresetCodec, ImportedPreset } from '../ports/preset-codec.js';
import { PresetPortError } from '../ports/preset-port-error.js';
import type { PresetStore } from '../ports/preset-store.js';

describe('preset use cases', () => {
  it('maps codec port errors to application errors for import use cases', async () => {
    const useCase = new ImportPresetUseCase(
      new NoopPresetStore(),
      new ThrowingPresetCodec(),
      new FixedIdGenerator('preset_1'),
      new FixedClock(1783090000000),
    );

    await expect(
      useCase.execute({
        ownerUserId: 'owner',
        content: Buffer.from('{}', 'utf8'),
      }),
    ).rejects.toMatchObject(
      new PresetApplicationError({
        reason: 'invalid-preset',
        params: {
          field: 'prompts',
        },
        cause: expect.any(PresetPortError),
      }),
    );
  });

  it('keeps duplicate prompt item errors on the application boundary', async () => {
    const useCase = new UpdatePresetPromptItemsUseCase(
      new InMemoryPresetStore([
        preset({
          id: 'preset_1',
          ownerUserId: 'owner',
          entries: [
            {
              id: 'entry_1',
              presetId: 'preset_1',
              identifier: 'main',
              name: 'Main',
              role: 'system',
              position: 'system',
              content: 'alpha',
              tokenCount: 1,
              metadata: {},
              createdAtMs: 1,
              updatedAtMs: 1,
            },
          ],
          promptItems: [],
        }),
      ]),
      new FixedClock(1783090000000),
    );

    await expect(
      useCase.execute({
        presetId: 'preset_1',
        viewerUserId: 'owner',
        items: [
          { entryId: 'entry_1', enabled: true },
          { entryId: 'entry_1', enabled: false },
        ],
      }),
    ).rejects.toMatchObject(
      new PresetApplicationError({
        reason: 'duplicate-entry',
        params: {
          presetId: 'preset_1',
          entryId: 'entry_1',
        },
      }),
    );
  });

  it('replaces the editable preset document as one aggregate', async () => {
    const store = new InMemoryPresetStore([
      preset({
        id: 'preset_1',
        ownerUserId: 'owner',
        entries: [
          {
            id: 'entry_1',
            presetId: 'preset_1',
            identifier: 'preserved-identifier',
            name: 'Old entry',
            role: 'system',
            position: 'system',
            content: 'old content',
            tokenCount: 2,
            metadata: { extension: true },
            createdAtMs: 10,
            updatedAtMs: 10,
          },
        ],
        promptItems: [{ entryId: 'entry_1', enabled: false, orderIndex: 0 }],
      }),
    ]);
    const useCase = new UpdatePresetDocumentUseCase(
      store,
      new FixedClock(1783090000000),
    );

    const updated = await useCase.execute({
      presetId: 'preset_1',
      viewerUserId: 'owner',
      name: 'Updated preset',
      modelSettings: {
        ...preset({}).modelSettings,
        stream: false,
      },
      entries: [
        {
          id: 'entry_1',
          name: 'Updated entry',
          role: 'user',
          position: 'chat',
          content: 'updated content',
        },
        {
          id: 'entry_2',
          name: 'New entry',
          role: 'assistant',
          position: 'postHistory',
          content: 'new content',
        },
      ],
      promptItems: [
        { entryId: 'entry_2', enabled: true },
        { entryId: 'entry_1', enabled: true },
      ],
    });

    expect(updated.name).toBe('Updated preset');
    expect(updated.modelSettings.stream).toBe(false);
    expect(updated.entries).toHaveLength(2);
    expect(updated.entries[0]).toMatchObject({
      id: 'entry_1',
      identifier: 'preserved-identifier',
      metadata: { extension: true },
      createdAtMs: 10,
      updatedAtMs: 1783090000000,
    });
    expect(updated.entries[1]).toMatchObject({
      id: 'entry_2',
      identifier: 'entry_2',
      metadata: {},
      createdAtMs: 1783090000000,
    });
    expect(updated.promptItems).toEqual([
      { entryId: 'entry_2', enabled: true, orderIndex: 0 },
      { entryId: 'entry_1', enabled: true, orderIndex: 1 },
    ]);
    expect(store.updatedPreset).toEqual(updated);
  });

  it('rejects prompt items that reference entries outside the document', async () => {
    const useCase = new UpdatePresetDocumentUseCase(
      new InMemoryPresetStore([preset({ id: 'preset_1' })]),
      new FixedClock(1783090000000),
    );

    await expect(
      useCase.execute({
        presetId: 'preset_1',
        viewerUserId: 'owner',
        name: 'Preset',
        modelSettings: preset({}).modelSettings,
        entries: [],
        promptItems: [{ entryId: 'missing', enabled: true }],
      }),
    ).rejects.toMatchObject(
      new PresetApplicationError({
        reason: 'unknown-entry',
        params: { presetId: 'preset_1', entryId: 'missing' },
      }),
    );
  });
});

class ThrowingPresetCodec implements PresetCodec {
  importFile(): ImportedPreset {
    throw new PresetPortError({
      reason: 'invalid-preset',
      params: {
        field: 'prompts',
      },
    });
  }

  exportPreset(): object {
    return {};
  }
}

class NoopPresetStore implements PresetStore {
  list(): Promise<PageResponse<PresetSummary>> {
    return Promise.resolve(emptyPage());
  }

  findOwnedById(): Promise<Preset | null> {
    return Promise.resolve(null);
  }

  save(): Promise<void> {
    return Promise.resolve();
  }

  update(): Promise<void> {
    return Promise.resolve();
  }

  deleteOwned(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

class InMemoryPresetStore implements PresetStore {
  updatedPreset: Preset | null = null;

  constructor(private readonly presets: Preset[] = []) {}

  list(): Promise<PageResponse<PresetSummary>> {
    return Promise.resolve(emptyPage());
  }

  findOwnedById(id: string, ownerUserId: string): Promise<Preset | null> {
    const preset = this.presets.find(
      (candidate) =>
        candidate.id === id && candidate.ownerUserId === ownerUserId,
    );
    return Promise.resolve(preset ?? null);
  }

  save(): Promise<void> {
    return Promise.resolve();
  }

  update(preset: Preset): Promise<void> {
    this.updatedPreset = preset;
    return Promise.resolve();
  }

  deleteOwned(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

function emptyPage(): PageResponse<PresetSummary> {
  return {
    items: [],
    pageIndex: 0,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  };
}

class FixedClock implements PresetClock {
  constructor(private readonly nowMs: number) {}

  now(): Date {
    return new Date(this.nowMs);
  }
}

class FixedIdGenerator implements PresetIdGenerator {
  constructor(private readonly value: string) {}

  createId(): string {
    return this.value;
  }
}

function preset(overrides: Partial<Preset>): Preset {
  return {
    id: overrides.id ?? 'preset',
    ownerUserId: overrides.ownerUserId ?? 'owner',
    name: overrides.name ?? 'Preset',
    modelProviderId: null,
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
    entries: [],
    promptItems: [],
    tokenCount: 0,
    sourceFormat: 'rolesta',
    sourceSnapshot: {},
    createdAtMs: 1,
    updatedAtMs: 1,
    lastUsedAtMs: null,
    usageCount: 0,
    ...overrides,
  };
}
