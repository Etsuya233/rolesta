import { UseCase } from '../../common/errors/use-case.decorator.js';
import type { CharacterClock } from './character-application-services.js';
import { CharacterApplicationError } from './character-application-error.js';
import { translateCharacterError } from './character-error.mapper.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';

export class DeleteCharacterAvatarUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly clock: CharacterClock,
  ) {}

  @UseCase(translateCharacterError)
  async execute(id: string, ownerUserId: string): Promise<void> {
    const updated = await this.store.replaceAvatar(id, ownerUserId, null, this.clock.now().getTime());
    if (!updated) {
      throw new CharacterApplicationError({ reason: 'not-found', params: { characterId: id } });
    }
  }
}
