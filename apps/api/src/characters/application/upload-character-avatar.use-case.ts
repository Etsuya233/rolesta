import { UseCase } from '../../common/errors/use-case.decorator.js';
import type { NormalizedCrop } from '../../files/ports/image-processor.js';
import type { CharacterClock } from './character-application-services.js';
import { CharacterApplicationError } from './character-application-error.js';
import { translateCharacterError } from './character-error.mapper.js';
import type { CharacterCard } from '../domain/character-card.js';
import type { CharacterAvatarService } from '../ports/character-avatar-service.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';

export class UploadCharacterAvatarUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly avatars: CharacterAvatarService,
    private readonly clock: CharacterClock,
  ) {}

  @UseCase(translateCharacterError)
  async execute(command: {
    id: string;
    ownerUserId: string;
    fileName: string;
    content: Buffer;
    crop: NormalizedCrop;
  }): Promise<CharacterCard> {
    const character = await this.store.findOwnedById(command.id, command.ownerUserId);
    if (!character) {
      throw new CharacterApplicationError({ reason: 'not-found', params: { characterId: command.id } });
    }

    const avatar = await this.avatars.createAvatar(command);
    const updated = await this.store.replaceAvatar(
      character.id,
      command.ownerUserId,
      avatar.resourceId,
      this.clock.now().getTime(),
    );
    if (!updated) {
      throw new CharacterApplicationError({ reason: 'not-found', params: { characterId: command.id } });
    }
    return updated;
  }
}
