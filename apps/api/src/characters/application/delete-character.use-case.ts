import { UseCase } from '../../common/errors/index.js';
import { CharacterApplicationError } from './character-application-error.js';
import { translateCharacterError } from './character-error.mapper.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';

export interface DeleteCharacterCommand {
  id: string;
  viewerUserId: string;
}

export class DeleteCharacterUseCase {
  constructor(private readonly store: CharacterCardStore) {}

  @UseCase(translateCharacterError)
  async execute(command: DeleteCharacterCommand): Promise<void> {
    const current = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (current === null) {
      throw new CharacterApplicationError({
        reason: 'not-found',
        params: { characterId: command.id },
      });
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new CharacterApplicationError({
        reason: 'forbidden',
        params: {
          characterId: command.id,
          viewerUserId: command.viewerUserId,
        },
      });
    }

    await this.store.deleteOwned(command.id, command.viewerUserId);
  }
}
