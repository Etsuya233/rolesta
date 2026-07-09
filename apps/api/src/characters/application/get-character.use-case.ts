import { CharacterApplicationError } from './character-application-error.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';
import type { CharacterCard } from '../domain/character-card.js';

export interface GetCharacterCommand {
  id: string;
  viewerUserId: string;
}

export class GetCharacterUseCase {
  constructor(private readonly store: CharacterCardStore) {}

  async execute(command: GetCharacterCommand): Promise<CharacterCard> {
    const card = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (card === null) {
      throw new CharacterApplicationError('not-found');
    }

    return card;
  }
}
