import type { PageResponse } from '@rolesta/shared';
import { describe, expect, it } from 'vitest';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { toWorldbookSummary, type Worldbook, type WorldbookSummary } from '../domain/worldbook.js';
import type {
  ImportedWorldbook,
  ImportWorldbookFile,
  WorldbookCodec,
} from '../ports/worldbook-codec.js';
import { WorldbookPortError } from '../ports/worldbook-port-error.js';
import type { ListWorldbooksRequest, WorldbookStore } from '../ports/worldbook-store.js';
import { CreateWorldbookEntryUseCase } from './create-worldbook-entry.use-case.js';
import { CreateWorldbookUseCase } from './create-worldbook.use-case.js';
import { DeleteWorldbookEntryUseCase } from './delete-worldbook-entry.use-case.js';
import { GetWorldbookUseCase } from './get-worldbook.use-case.js';
import { ImportWorldbookUseCase } from './import-worldbook.use-case.js';
import { UpdateWorldbookEntryOrderUseCase } from './update-worldbook-entry-order.use-case.js';
import { UpdateWorldbookEntryUseCase } from './update-worldbook-entry.use-case.js';
import { UpdateWorldbookDocumentUseCase } from './update-worldbook-document.use-case.js';
import { UpdateWorldbookUseCase } from './update-worldbook.use-case.js';

describe('worldbook use cases', () => {
  it('creates private worldbooks with generated id and timestamps', async () => {
    const store = new InMemoryWorldbookStore();
    const useCase = new CreateWorldbookUseCase(
      store,
      new SequenceIdGenerator(['book-1']),
      new FixedClock(1783090000000),
      unitOfWork,
    );

    const worldbook = await useCase.execute({
      ownerUserId: 'owner',
      name: 'Created',
      visibility: 'public',
      tags: ['lore'],
    });

    expect(worldbook).toMatchObject({
      id: 'book-1',
      ownerUserId: 'owner',
      visibility: 'public',
      name: 'Created',
      tags: ['lore'],
      createdAtMs: 1783090000000,
      updatedAtMs: 1783090000000,
      usageCount: 0,
    });
    expect(await store.findOwnedById('book-1', 'owner')).toMatchObject({
      name: 'Created',
    });
  });

  it('allows public reads and blocks non-owner writes', async () => {
    const store = new InMemoryWorldbookStore([
      worldbook({ id: 'book-1', ownerUserId: 'owner', visibility: 'public' }),
    ]);
    const getUseCase = new GetWorldbookUseCase(store);
    const updateUseCase = new UpdateWorldbookUseCase(
      store,
      new FixedClock(1783090000100),
      unitOfWork,
    );

    await expect(
      getUseCase.execute({ id: 'book-1', viewerUserId: 'reader' }),
    ).resolves.toMatchObject({ id: 'book-1' });
    await expect(
      updateUseCase.execute({
        id: 'book-1',
        viewerUserId: 'reader',
        name: 'Blocked',
      }),
    ).rejects.toMatchObject({
      reason: 'forbidden',
      params: { worldbookId: 'book-1', viewerUserId: 'reader' },
    });
  });

  it('translates worldbook codec failures at the application boundary', async () => {
    const useCase = new ImportWorldbookUseCase(
      new InMemoryWorldbookStore(),
      new FailingWorldbookCodec(),
      new SequenceIdGenerator(['book-1']),
      new FixedClock(1783090000100),
      unitOfWork,
    );

    await expect(
      useCase.execute({
        ownerUserId: 'owner',
        fileName: 'bad.json',
        content: Buffer.from('{'),
      }),
    ).rejects.toMatchObject({
      reason: 'invalid-import-file',
      params: { fileName: 'bad.json', field: 'content' },
    });
  });

  it('creates, updates, deletes, orders, and toggles entries', async () => {
    const store = new InMemoryWorldbookStore([worldbook({ id: 'book-1' })]);
    const ids = new SequenceIdGenerator(['entry-1', 'entry-2']);
    const clock = new FixedClock(1783090000200);
    const createUseCase = new CreateWorldbookEntryUseCase(store, ids, clock, unitOfWork);
    const updateUseCase = new UpdateWorldbookEntryUseCase(store, clock, unitOfWork);
    const orderUseCase = new UpdateWorldbookEntryOrderUseCase(store, clock, unitOfWork);
    const deleteUseCase = new DeleteWorldbookEntryUseCase(store, clock, unitOfWork);

    await createUseCase.execute({
      worldbookId: 'book-1',
      viewerUserId: 'owner',
      name: 'Alpha',
      content: 'alpha content',
      primaryKeys: ['alpha'],
      selectiveLogic: 'andAll',
      vectorized: true,
      insertionPosition: 'atAnchor',
      insertionRole: 'user',
      anchorName: 'alpha-anchor',
      scanDepth: 5,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: true,
    });
    await createUseCase.execute({
      worldbookId: 'book-1',
      viewerUserId: 'owner',
      name: 'Beta',
      content: 'beta content',
      enabled: false,
    });
    const updated = await updateUseCase.execute({
      worldbookId: 'book-1',
      entryId: 'entry-1',
      viewerUserId: 'owner',
      content: 'alpha edited',
      probability: 80,
    });

    expect(updated.entries[0]).toMatchObject({
      id: 'entry-1',
      content: 'alpha edited',
      selectiveLogic: 'andAll',
      vectorized: true,
      insertionPosition: 'atAnchor',
      insertionRole: 'user',
      anchorName: 'alpha-anchor',
      scanDepth: 5,
      excludeRecursion: true,
      preventRecursion: true,
      delayUntilRecursion: true,
      probability: 80,
    });
    expect(updated.entries[0]?.tokenCount).toBeGreaterThan(0);

    const ordered = await orderUseCase.execute({
      worldbookId: 'book-1',
      viewerUserId: 'owner',
      entries: [
        { entryId: 'entry-2', enabled: true },
        { entryId: 'entry-1', enabled: false },
      ],
    });

    expect(ordered.entries.map((entry) => [entry.id, entry.enabled, entry.insertionOrder])).toEqual(
      [
        ['entry-2', true, 0],
        ['entry-1', false, 1],
      ],
    );

    const deleted = await deleteUseCase.execute({
      worldbookId: 'book-1',
      entryId: 'entry-1',
      viewerUserId: 'owner',
    });

    expect(deleted.entries.map((entry) => entry.id)).toEqual(['entry-2']);
  });

  it('rejects duplicate or unknown entry order updates', async () => {
    const store = new InMemoryWorldbookStore([
      worldbook({
        id: 'book-1',
        entries: [worldbookEntry({ id: 'entry-1', worldbookId: 'book-1' })],
      }),
    ]);
    const useCase = new UpdateWorldbookEntryOrderUseCase(
      store,
      new FixedClock(1783090000300),
      unitOfWork,
    );

    await expect(
      useCase.execute({
        worldbookId: 'book-1',
        viewerUserId: 'owner',
        entries: [
          { entryId: 'entry-1', enabled: true },
          { entryId: 'entry-1', enabled: false },
        ],
      }),
    ).rejects.toMatchObject({
      reason: 'duplicate-entry',
      params: { worldbookId: 'book-1', entryId: 'entry-1' },
    });
    await expect(
      useCase.execute({
        worldbookId: 'book-1',
        viewerUserId: 'owner',
        entries: [{ entryId: 'missing', enabled: true }],
      }),
    ).rejects.toMatchObject({
      reason: 'unknown-entry',
      params: { worldbookId: 'book-1', entryId: 'missing' },
    });
  });

  it('rejects entry order updates that omit existing entries', async () => {
    const store = new InMemoryWorldbookStore([
      worldbook({
        id: 'book-1',
        entries: [
          worldbookEntry({ id: 'entry-1', worldbookId: 'book-1' }),
          worldbookEntry({ id: 'entry-2', worldbookId: 'book-1' }),
        ],
      }),
    ]);
    const useCase = new UpdateWorldbookEntryOrderUseCase(
      store,
      new FixedClock(1783090000400),
      unitOfWork,
    );

    await expect(
      useCase.execute({
        worldbookId: 'book-1',
        viewerUserId: 'owner',
        entries: [{ entryId: 'entry-1', enabled: true }],
      }),
    ).rejects.toMatchObject({
      reason: 'unknown-entry',
      params: { worldbookId: 'book-1' },
    });

    expect((await store.findOwnedById('book-1', 'owner'))?.entries).toHaveLength(2);
  });

  it('replaces the complete worldbook document in one update', async () => {
    const store = new InMemoryWorldbookStore([
      worldbook({
        id: 'book-1',
        name: 'Before',
        entries: [
          worldbookEntry({
            id: 'entry-1',
            worldbookId: 'book-1',
            content: 'before',
            createdAtMs: 100,
          }),
        ],
      }),
    ]);
    const useCase = new UpdateWorldbookDocumentUseCase(
      store,
      new SequenceIdGenerator(['entry-2']),
      new FixedClock(1783090000500),
      unitOfWork,
    );

    const updated = await useCase.execute({
      worldbookId: 'book-1',
      viewerUserId: 'owner',
      visibility: 'public',
      name: 'After',
      description: 'Complete document',
      tags: ['updated'],
      scanDepth: 7,
      tokenBudget: 2048,
      recursiveScan: true,
      entries: [
        documentEntry({
          id: 'entry-1',
          name: 'Existing',
          content: 'existing updated',
        }),
        documentEntry({
          id: 'client-entry',
          name: 'Created',
          content: 'new entry',
          enabled: false,
        }),
      ],
    });

    expect(updated).toMatchObject({
      name: 'After',
      visibility: 'public',
      description: 'Complete document',
      tags: ['updated'],
      scanDepth: 7,
      tokenBudget: 2048,
      recursiveScan: true,
      updatedAtMs: 1783090000500,
    });
    expect(updated.entries.map((entry) => entry.id)).toEqual(['entry-1', 'entry-2']);
    expect(updated.entries[0]).toMatchObject({
      content: 'existing updated',
      insertionOrder: 0,
      createdAtMs: 100,
      updatedAtMs: 1783090000500,
    });
    expect(updated.entries[1]).toMatchObject({
      enabled: false,
      insertionOrder: 1,
      createdAtMs: 1783090000500,
    });
    expect(updated.entries[0]?.tokenCount).toBeGreaterThan(0);
  });

  it('rejects duplicate ids in a complete worldbook document', async () => {
    const store = new InMemoryWorldbookStore([worldbook({ id: 'book-1' })]);
    const useCase = new UpdateWorldbookDocumentUseCase(
      store,
      new SequenceIdGenerator([]),
      new FixedClock(1783090000500),
      unitOfWork,
    );
    const entry = documentEntry({ id: 'duplicate' });

    await expect(
      useCase.execute({
        worldbookId: 'book-1',
        viewerUserId: 'owner',
        visibility: 'private',
        name: 'Book',
        description: '',
        tags: [],
        scanDepth: 3,
        tokenBudget: 1024,
        recursiveScan: false,
        entries: [entry, entry],
      }),
    ).rejects.toMatchObject({
      reason: 'duplicate-entry',
      params: { worldbookId: 'book-1', entryId: 'duplicate' },
    });
  });
});

const unitOfWork: UnitOfWork = { run: (operation) => operation() };

class InMemoryWorldbookStore implements WorldbookStore {
  private readonly worldbooks = new Map<string, Worldbook>();

  constructor(worldbooks: Worldbook[] = []) {
    for (const book of worldbooks) {
      this.worldbooks.set(book.id, book);
    }
  }

  list(request: ListWorldbooksRequest): Promise<PageResponse<WorldbookSummary>> {
    const items = Array.from(this.worldbooks.values()).filter(
      (book) => book.ownerUserId === request.viewerUserId || book.visibility === 'public',
    );

    return Promise.resolve({
      items: items.map(toWorldbookSummary),
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems: items.length,
      totalPages: 1,
    });
  }

  findVisibleById(id: string, viewerUserId: string): Promise<Worldbook | null> {
    const book = this.worldbooks.get(id);

    if (book === undefined || (book.ownerUserId !== viewerUserId && book.visibility !== 'public')) {
      return Promise.resolve(null);
    }

    return Promise.resolve(book);
  }

  findOwnedById(id: string, ownerUserId: string): Promise<Worldbook | null> {
    const book = this.worldbooks.get(id);
    return Promise.resolve(book?.ownerUserId === ownerUserId ? book : null);
  }

  save(worldbook: Worldbook): Promise<void> {
    this.worldbooks.set(worldbook.id, worldbook);
    return Promise.resolve();
  }

  update(worldbook: Worldbook): Promise<void> {
    this.worldbooks.set(worldbook.id, worldbook);
    return Promise.resolve();
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const book = await this.findOwnedById(id, ownerUserId);

    if (book === null) {
      return false;
    }

    return this.worldbooks.delete(id);
  }
}

class FailingWorldbookCodec implements WorldbookCodec {
  importFile(file: ImportWorldbookFile): ImportedWorldbook {
    throw new WorldbookPortError({
      reason: 'invalid-import-file',
      params: { fileName: file.fileName, field: 'content' },
    });
  }

  exportWorldbook(): object {
    return {};
  }
}

class SequenceIdGenerator {
  private index = 0;

  constructor(private readonly ids: string[]) {}

  createId(): string {
    const id = this.ids[this.index]!;
    this.index += 1;
    return id;
  }
}

class FixedClock {
  constructor(private readonly nowMs: number) {}

  now(): Date {
    return new Date(this.nowMs);
  }
}

function worldbook(overrides: Partial<Worldbook>): Worldbook {
  return {
    id: overrides.id ?? 'book',
    ownerUserId: overrides.ownerUserId ?? 'owner',
    visibility: overrides.visibility ?? 'private',
    name: overrides.name ?? 'Book',
    description: overrides.description ?? '',
    tags: overrides.tags ?? [],
    scanDepth: overrides.scanDepth ?? 3,
    tokenBudget: overrides.tokenBudget ?? 1024,
    recursiveScan: overrides.recursiveScan ?? false,
    entries: overrides.entries ?? [],
    sourceFormat: overrides.sourceFormat ?? 'rolesta',
    sourceSnapshot: overrides.sourceSnapshot ?? {},
    createdAtMs: overrides.createdAtMs ?? 1,
    updatedAtMs: overrides.updatedAtMs ?? 1,
    lastUsedAtMs: overrides.lastUsedAtMs ?? null,
    usageCount: overrides.usageCount ?? 0,
  };
}

function worldbookEntry(
  overrides: Partial<Worldbook['entries'][number]>,
): Worldbook['entries'][number] {
  return {
    id: overrides.id ?? 'entry',
    worldbookId: overrides.worldbookId ?? 'book',
    enabled: overrides.enabled ?? true,
    name: overrides.name ?? 'Entry',
    comment: overrides.comment ?? '',
    content: overrides.content ?? 'content',
    primaryKeys: overrides.primaryKeys ?? [],
    secondaryKeys: overrides.secondaryKeys ?? [],
    selective: overrides.selective ?? false,
    selectiveLogic: overrides.selectiveLogic ?? 'andAny',
    constant: overrides.constant ?? false,
    vectorized: overrides.vectorized ?? false,
    caseSensitive: overrides.caseSensitive ?? false,
    matchWholeWords: overrides.matchWholeWords ?? false,
    insertionPosition: overrides.insertionPosition ?? 'beforeCharacterDefinition',
    insertionOrder: overrides.insertionOrder ?? 0,
    depth: overrides.depth ?? 3,
    insertionRole: overrides.insertionRole ?? 'system',
    anchorName: overrides.anchorName ?? '',
    scanDepth: overrides.scanDepth ?? null,
    excludeRecursion: overrides.excludeRecursion ?? false,
    preventRecursion: overrides.preventRecursion ?? false,
    delayUntilRecursion: overrides.delayUntilRecursion ?? false,
    probability: overrides.probability ?? 100,
    tokenCount: overrides.tokenCount ?? 1,
    createdAtMs: overrides.createdAtMs ?? 1,
    updatedAtMs: overrides.updatedAtMs ?? 1,
  };
}

function documentEntry(
  overrides: Partial<Parameters<UpdateWorldbookDocumentUseCase['execute']>[0]['entries'][number]>,
): Parameters<UpdateWorldbookDocumentUseCase['execute']>[0]['entries'][number] {
  return {
    id: overrides.id ?? 'entry',
    enabled: overrides.enabled ?? true,
    name: overrides.name ?? 'Entry',
    comment: overrides.comment ?? '',
    content: overrides.content ?? 'content',
    primaryKeys: overrides.primaryKeys ?? [],
    secondaryKeys: overrides.secondaryKeys ?? [],
    selective: overrides.selective ?? false,
    selectiveLogic: overrides.selectiveLogic ?? 'andAny',
    constant: overrides.constant ?? false,
    vectorized: overrides.vectorized ?? false,
    caseSensitive: overrides.caseSensitive ?? false,
    matchWholeWords: overrides.matchWholeWords ?? false,
    insertionPosition: overrides.insertionPosition ?? 'beforeCharacterDefinition',
    depth: overrides.depth ?? 3,
    insertionRole: overrides.insertionRole ?? 'system',
    anchorName: overrides.anchorName ?? '',
    scanDepth: overrides.scanDepth ?? null,
    excludeRecursion: overrides.excludeRecursion ?? false,
    preventRecursion: overrides.preventRecursion ?? false,
    delayUntilRecursion: overrides.delayUntilRecursion ?? false,
    probability: overrides.probability ?? 100,
  };
}
