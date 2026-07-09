import type { CharacterClock, CharacterIdGenerator } from './character-application-services.js';
import type { CharacterCard } from '../domain/character-card.js';
import { ensureEpochMillis } from '../domain/epoch-millis.js';
import type { CharacterCardCodec } from '../ports/character-card-codec.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';

export interface ImportCharacterCardCommand {
  ownerUserId: string;
  fileName: string;
  content: Buffer;
}

export class ImportCharacterCardUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly codec: CharacterCardCodec,
    private readonly idGenerator: CharacterIdGenerator,
    private readonly clock: CharacterClock,
  ) {}

  async execute(command: ImportCharacterCardCommand): Promise<CharacterCard> {
    const imported = this.codec.importFile({
      fileName: command.fileName,
      content: command.content,
    });
    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const card: CharacterCard = {
      ...imported,
      id: this.idGenerator.createId(),
      ownerUserId: command.ownerUserId,
      visibility: 'private',
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      lastUsedAtMs: null,
      usageCount: 0,
    };

    await this.store.save(card);

    return card;
  }
}
