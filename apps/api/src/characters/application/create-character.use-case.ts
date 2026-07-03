import {
  applyCharacterCardEditableFields,
  type CharacterCardEditableFields,
} from './character-card-editable-fields.js';
import type { CharacterCardStore } from './character-card-store.js';
import type { CharacterClock, CharacterIdGenerator } from './character-application-services.js';
import { createEmptyCharacterCardDraft, type CharacterCard } from '../domain/character-card.js';
import { ensureEpochMillis } from '../domain/epoch-millis.js';

export interface CreateCharacterCommand extends CharacterCardEditableFields {
  ownerUserId: string;
}

export class CreateCharacterUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly idGenerator: CharacterIdGenerator,
    private readonly clock: CharacterClock,
  ) {}

  async execute(command: CreateCharacterCommand): Promise<CharacterCard> {
    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const draft = createEmptyCharacterCardDraft({
      id: this.idGenerator.createId(),
      ownerUserId: command.ownerUserId,
      nowMs,
    });
    const card = applyCharacterCardEditableFields(draft, command);

    await this.store.save(card);

    return card;
  }
}
