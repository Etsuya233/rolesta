import { describe, expect, it } from 'vitest';
import type { PageResponse } from '@rolesta/shared';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import type { DomainEventPublisher } from '../../common/events/index.js';
import { createDefaultPresetModelSettings } from '../domain/preset-model-settings.js';
import {
  createDefaultPresetPromptItems,
  withPresetTokenCount,
  type Preset,
  type PresetSummary,
} from '../domain/preset.js';
import type { PresetCodec, ImportedPreset } from '../ports/preset-codec.js';
import type { PresetModelProviderAccess } from '../ports/preset-model-provider-access.js';
import type { PresetStore } from '../ports/preset-store.js';
import { CreatePresetUseCase } from './create-preset.use-case.js';
import { ImportPresetUseCase } from './import-preset.use-case.js';
import { UpdatePresetDocumentUseCase } from './update-preset-document.use-case.js';
import { UpdatePresetPromptItemsUseCase } from './update-preset-prompt-items.use-case.js';

describe('preset use cases', () => {
  it('creates a preset with all twelve system items', async () => {
    const store = new InMemoryPresetStore();
    const useCase = new CreatePresetUseCase(
      store,
      new FixedIdGenerator(),
      new FixedClock(),
      new InMemoryPresetModelProviderAccess(),
      unitOfWork,
    );

    const created = await useCase.execute({ ownerUserId: 'owner', name: 'New preset' });

    expect(created.promptItems).toHaveLength(12);
    expect(created.entries).toHaveLength(0);
    expect(store.savedPreset).toEqual(created);
  });

  it('returns import issues and supplemented item keys', async () => {
    const importedIdGenerator = new FixedIdGenerator();
    const imported: ImportedPreset = {
      name: 'Imported',
      modelSettings: createDefaultPresetModelSettings(),
      tokenizer: 'cl100k_base',
      entries: [],
      promptItems: createDefaultPresetPromptItems(() => importedIdGenerator.createId())
        .filter((item) => item.kind !== 'customPrompt')
        .map((item) => ({ ...item, enabled: false })),
      issues: [{ identifier: 'unknown', name: 'Unknown', reason: 'unknown-marker' }],
      supplementedItems: ['mainPrompt'],
      sourceSnapshot: {},
    };
    const useCase = new ImportPresetUseCase(
      new InMemoryPresetStore(),
      new FixedPresetCodec(imported),
      new FixedIdGenerator(),
      new FixedClock(),
      unitOfWork,
    );

    const result = await useCase.execute({ ownerUserId: 'owner', content: Buffer.from('{}') });

    expect(result.preset.promptItems).toHaveLength(12);
    expect(result.issues).toEqual(imported.issues);
    expect(result.supplementedItems).toEqual(['mainPrompt']);
  });

  it('updates the full typed document while preserving custom entry identity', async () => {
    const current = basePreset();
    current.entries.push({
      id: 'entry_1',
      presetId: current.id,
      identifier: 'custom_1',
      name: 'Old',
      role: 'system',
      content: 'old',
      placement: { kind: 'relative' },
      generationTypes: [],
      tokenCount: 1,
      metadata: { extension: true },
      createdAtMs: 10,
      updatedAtMs: 10,
    });
    current.promptItems.push({
      id: 'custom_item',
      kind: 'customPrompt',
      entryId: 'entry_1',
      enabled: false,
      orderIndex: current.promptItems.length,
    });
    const store = new InMemoryPresetStore([current]);
    const useCase = new UpdatePresetDocumentUseCase(
      store,
      new FixedClock(),
      new InMemoryPresetModelProviderAccess(),
      unitOfWork,
      events,
    );
    const main = current.promptItems.find(
      (item) => item.kind === 'systemPrompt' && item.systemPrompt === 'mainPrompt',
    )!;
    const updated = await useCase.execute({
      presetId: current.id,
      viewerUserId: 'owner',
      visibility: 'public',
      name: 'Updated',
      modelProviderId: null,
      modelSettings: current.modelSettings,
      entries: [
        {
          id: 'entry_1',
          name: 'Updated custom',
          role: 'user',
          content: 'updated',
          placement: { kind: 'inChat', depth: 4, order: 100 },
          generationTypes: ['quiet'],
        },
      ],
      promptItems: current.promptItems.map((item) =>
        item.id === main.id && item.kind === 'systemPrompt'
          ? { ...item, content: 'Changed main', enabled: true }
          : item,
      ),
    });

    expect(updated.name).toBe('Updated');
    expect(updated.entries[0]).toMatchObject({
      identifier: 'custom_1',
      metadata: { extension: true },
      content: 'updated',
    });
    expect(updated.promptItems.find((item) => item.id === main.id)).toMatchObject({
      kind: 'systemPrompt',
      content: 'Changed main',
    });
  });

  it('keeps system items required when updating prompt item state', async () => {
    const current = basePreset();
    const useCase = new UpdatePresetPromptItemsUseCase(
      new InMemoryPresetStore([current]),
      new FixedClock(),
      unitOfWork,
    );

    await expect(
      useCase.execute({
        presetId: current.id,
        viewerUserId: 'owner',
        items: current.promptItems.slice(1).map((item) => ({ id: item.id, enabled: item.enabled })),
      }),
    ).rejects.toMatchObject({ reason: 'invalid-preset' });
  });
});

const unitOfWork: UnitOfWork = { run: (operation) => operation() };
const events = { publish: () => Promise.resolve() } as unknown as DomainEventPublisher;

class FixedPresetCodec implements PresetCodec {
  constructor(private readonly imported: ImportedPreset) {}
  importFile(): ImportedPreset {
    return this.imported;
  }
  exportPreset(): object {
    return {};
  }
}

class InMemoryPresetStore implements PresetStore {
  savedPreset: Preset | null = null;
  updatedPreset: Preset | null = null;
  constructor(private readonly presets: Preset[] = []) {}
  list(): Promise<PageResponse<PresetSummary>> {
    return Promise.resolve({ items: [], pageIndex: 0, pageSize: 20, totalItems: 0, totalPages: 0 });
  }
  findOwnedById(id: string, ownerUserId: string): Promise<Preset | null> {
    return Promise.resolve(
      this.presets.find((preset) => preset.id === id && preset.ownerUserId === ownerUserId) ?? null,
    );
  }
  findVisibleById(id: string, viewerUserId: string): Promise<Preset | null> {
    return Promise.resolve(
      this.presets.find(
        (preset) =>
          preset.id === id &&
          (preset.ownerUserId === viewerUserId || preset.visibility === 'public'),
      ) ?? null,
    );
  }
  save(preset: Preset): Promise<void> {
    this.savedPreset = preset;
    return Promise.resolve();
  }
  update(preset: Preset): Promise<void> {
    this.updatedPreset = preset;
    return Promise.resolve();
  }
  updateModelProviderAssociation(): Promise<void> {
    return Promise.resolve();
  }
  clearModelProviderAssociations(): Promise<void> {
    return Promise.resolve();
  }
  deleteOwned(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

class InMemoryPresetModelProviderAccess implements PresetModelProviderAccess {
  acquireOwned(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class FixedClock {
  now(): Date {
    return new Date(1783090000000);
  }
}

class FixedIdGenerator {
  private value = 0;
  createId(): string {
    this.value += 1;
    return `id_${this.value}`;
  }
}

function basePreset(): Preset {
  const generator = new FixedIdGenerator();
  return withPresetTokenCount({
    id: 'preset_1',
    ownerUserId: 'owner',
    visibility: 'private',
    name: 'Preset',
    modelProviderId: null,
    modelSettings: createDefaultPresetModelSettings(),
    tokenizer: 'cl100k_base',
    entries: [],
    promptItems: createDefaultPresetPromptItems(() => generator.createId()),
    sourceFormat: 'rolesta',
    sourceSnapshot: {},
    createdAtMs: 1,
    updatedAtMs: 1,
    lastUsedAtMs: null,
    usageCount: 0,
  });
}
