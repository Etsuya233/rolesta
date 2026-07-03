import { CharacterApplicationError } from './character-application-error.js';
import type { CharacterCardStore } from './character-card-store.js';
import type { CharacterClock, CharacterIdGenerator } from './character-application-services.js';
import type { CharacterCard } from '../domain/character-card.js';
import { ensureEpochMillis } from '../domain/epoch-millis.js';
import { fromSillyTavernCharacterCard } from '../infrastructure/silly-tavern-character-card.mapper.js';
import { readSillyTavernPngMetadata } from '../infrastructure/silly-tavern-png-metadata.reader.js';

export interface ImportCharacterCardCommand {
  ownerUserId: string;
  fileName: string;
  content: Buffer;
}

export class ImportCharacterCardUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly idGenerator: CharacterIdGenerator,
    private readonly clock: CharacterClock,
  ) {}

  async execute(command: ImportCharacterCardCommand): Promise<CharacterCard> {
    const imported = fromSillyTavernCharacterCard(importFileContent(command.fileName, command.content));
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

function importFileContent(fileName: string, content: Buffer): unknown {
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedFileName.endsWith('.png')) {
    return readSillyTavernPngMetadata(content);
  }

  if (!normalizedFileName.endsWith('.json')) {
    throw new CharacterApplicationError('invalid-import-file');
  }

  try {
    return JSON.parse(content.toString('utf8')) as unknown;
  } catch {
    throw new CharacterApplicationError('invalid-import-file');
  }
}
