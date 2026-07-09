import { CharacterApplicationError } from './character-application-error.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';

export interface DeleteCharacterCommand {
  id: string;
  viewerUserId: string;
}

export class DeleteCharacterUseCase {
  constructor(private readonly store: CharacterCardStore) {}

  async execute(command: DeleteCharacterCommand): Promise<void> {
    const current = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (current === null) {
      throw new CharacterApplicationError('not-found');
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new CharacterApplicationError('forbidden');
    }

    await this.store.deleteOwned(command.id, command.viewerUserId);
  }
}
