import { describe, expect, it } from 'vitest';
import type { PageResponse } from '@rolesta/shared';
import { createEmptyCharacterCardDraft, type CharacterCard } from '../domain/character-card.js';
import type {
  CharacterCardCodec,
  ExportCharacterCardOptions,
  ImportedCharacterCard,
  ImportCharacterCardFile,
} from '../ports/character-card-codec.js';
import { CharacterPortError } from '../ports/character-port-error.js';
import type { CharacterCardStore, ListCharactersRequest } from '../ports/character-card-store.js';
import { CharacterApplicationError } from './character-application-error.js';
import { CreateCharacterUseCase } from './create-character.use-case.js';
import { ExportCharacterCardUseCase } from './export-character-card.use-case.js';
import { ImportCharacterCardUseCase } from './import-character-card.use-case.js';
import { UpdateCharacterUseCase } from './update-character.use-case.js';

describe('character use cases', () => {
  it('creates private cards with generated id and clock timestamps', async () => {
    const store = new InMemoryCharacterCardStore();
    const useCase = new CreateCharacterUseCase(store, new FixedIdGenerator('card_1'), new FixedClock(1783090000000));

    const card = await useCase.execute({
      ownerUserId: 'owner',
      name: 'Created',
      firstMessage: 'Hello',
    });

    expect(card).toMatchObject({
      id: 'card_1',
      ownerUserId: 'owner',
      visibility: 'private',
      name: 'Created',
      firstMessage: 'Hello',
      createdAtMs: 1783090000000,
      updatedAtMs: 1783090000000,
      usageCount: 0,
    });
    expect(await store.findOwnedById('card_1', 'owner')).toMatchObject({ name: 'Created' });
  });

  it('blocks another user from updating a public card', async () => {
    const store = new InMemoryCharacterCardStore([
      characterCard({ id: 'card_1', ownerUserId: 'owner', visibility: 'public' }),
    ]);
    const useCase = new UpdateCharacterUseCase(store, new FixedClock(1783090000100));

    await expect(
      useCase.execute({
        id: 'card_1',
        viewerUserId: 'reader',
        comment: 'edited',
      }),
    ).rejects.toMatchObject(
      new CharacterApplicationError({
        reason: 'forbidden',
        params: {
          characterId: 'card_1',
          viewerUserId: 'reader',
        },
      }),
    );
  });

  it('exports a visible card as SillyTavern V3 by default', async () => {
    const store = new InMemoryCharacterCardStore([
      characterCard({ id: 'card_1', ownerUserId: 'owner', name: 'Exported', firstMessage: 'Hello' }),
    ]);
    const useCase = new ExportCharacterCardUseCase(store, new FakeCharacterCardCodec());

    await expect(useCase.execute({ id: 'card_1', viewerUserId: 'owner' })).resolves.toMatchObject({
      format: 'character-card',
      version: 'v3',
      name: 'Exported',
    });
  });

  it('maps codec port errors to application errors for import use cases', async () => {
    const store = new InMemoryCharacterCardStore();
    const useCase = new ImportCharacterCardUseCase(store, new ThrowingCharacterCardCodec(), new FixedIdGenerator('card_1'), new FixedClock(1783090000000));

    await expect(
      useCase.execute({
        ownerUserId: 'owner',
        fileName: 'character.json',
        content: Buffer.from('{}', 'utf8'),
      }),
    ).rejects.toMatchObject(
      new CharacterApplicationError({
        reason: 'invalid-character-card',
        params: {
          field: 'name',
          detail: 'Missing required name field.',
        },
      }),
    );
  });
});

class FakeCharacterCardCodec implements CharacterCardCodec {
  importFile(file: ImportCharacterCardFile): ImportedCharacterCard {
    return {
      ...createEmptyCharacterCardDraft({
        id: 'imported',
        ownerUserId: 'importer',
        nowMs: 1783090000000,
      }),
      name: file.fileName,
      sourceSnapshot: file.content.toString('utf8'),
    };
  }

  exportCard(card: CharacterCard, options: ExportCharacterCardOptions): object {
    return {
      format: 'character-card',
      version: options.version,
      name: card.name,
    };
  }
}

class ThrowingCharacterCardCodec implements CharacterCardCodec {
  importFile(file: ImportCharacterCardFile): ImportedCharacterCard {
    void file;

    throw new CharacterPortError({
      reason: 'invalid-character-card',
      params: {
        field: 'name',
        detail: 'Missing required name field.',
      },
    });
  }

  exportCard(card: CharacterCard, options: ExportCharacterCardOptions): object {
    void card;
    void options;

    return {};
  }
}

class InMemoryCharacterCardStore implements CharacterCardStore {
  private readonly cards = new Map<string, CharacterCard>();

  constructor(cards: CharacterCard[] = []) {
    for (const card of cards) {
      this.cards.set(card.id, card);
    }
  }

  list(request: ListCharactersRequest): Promise<PageResponse<CharacterCard>> {
    const items = Array.from(this.cards.values()).filter(
      (card) => card.ownerUserId === request.viewerUserId || card.visibility === 'public',
    );

    return Promise.resolve({
      items,
      pageIndex: request.pageIndex,
      pageSize: request.pageSize,
      totalItems: items.length,
      totalPages: 1,
    });
  }

  findVisibleById(id: string, viewerUserId: string): Promise<CharacterCard | null> {
    const card = this.cards.get(id);

    if (card === undefined || (card.ownerUserId !== viewerUserId && card.visibility !== 'public')) {
      return Promise.resolve(null);
    }

    return Promise.resolve(card);
  }

  findOwnedById(id: string, ownerUserId: string): Promise<CharacterCard | null> {
    const card = this.cards.get(id);
    return Promise.resolve(card?.ownerUserId === ownerUserId ? card : null);
  }

  save(card: CharacterCard): Promise<void> {
    this.cards.set(card.id, card);
    return Promise.resolve();
  }

  update(card: CharacterCard): Promise<void> {
    this.cards.set(card.id, card);
    return Promise.resolve();
  }

  async replaceAvatar(
    id: string,
    ownerUserId: string,
    avatarResourceId: string | null,
    nowMs: number,
  ): Promise<CharacterCard | null> {
    const card = await this.findOwnedById(id, ownerUserId);
    if (!card) {
      return null;
    }
    const updated = { ...card, avatarResourceId, updatedAtMs: nowMs };
    this.cards.set(id, updated);
    return updated;
  }

  async deleteOwned(id: string, ownerUserId: string): Promise<boolean> {
    const card = await this.findOwnedById(id, ownerUserId);

    if (card === null) {
      return false;
    }

    return this.cards.delete(id);
  }
}

class FixedIdGenerator {
  constructor(private readonly id: string) {}

  createId(): string {
    return this.id;
  }
}

class FixedClock {
  constructor(private readonly nowMs: number) {}

  now(): Date {
    return new Date(this.nowMs);
  }
}

function characterCard(overrides: Partial<CharacterCard>): CharacterCard {
  return {
    ...createEmptyCharacterCardDraft({
      id: overrides.id ?? 'card',
      ownerUserId: overrides.ownerUserId ?? 'owner',
      nowMs: 1783090000000,
    }),
    name: overrides.name ?? 'Card',
    firstMessage: overrides.firstMessage ?? 'Hello',
    visibility: overrides.visibility ?? 'private',
    ...overrides,
  };
}
