import { UseCase } from '../../common/errors/index.js';
import { CharacterApplicationError } from './character-application-error.js';
import { translateCharacterError } from './character-error.mapper.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';
import type { CharacterCard } from '../domain/character-card.js';

export interface GetCharacterCommand {
  id: string;
  viewerUserId: string;
}

export class GetCharacterUseCase {
  constructor(private readonly store: CharacterCardStore) {}

  @UseCase(translateCharacterError)
  async execute(command: GetCharacterCommand): Promise<CharacterCard> {
    const card = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (card === null) {
      throw new CharacterApplicationError({
        reason: 'not-found',
        params: { characterId: command.id },
      });
    }

    return card;
  }
}
