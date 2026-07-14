import { UseCase } from '../../common/errors/use-case.decorator.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import type { DomainEventPublisher } from '../../common/events/index.js';
import type { NormalizedCrop } from '../../files/ports/image-processor.js';
import type { CharacterClock } from './character-application-services.js';
import { CharacterApplicationError } from './character-application-error.js';
import { translateCharacterError } from './character-error.mapper.js';
import type { CharacterCard } from '../domain/character-card.js';
import type { CharacterAvatarAssignment } from '../ports/character-avatar-assignment.js';
import type { CharacterAvatarService } from '../ports/character-avatar-service.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';
import { CharacterAvatarChangedEvent } from '../events/index.js';

export class UploadCharacterAvatarUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly avatars: CharacterAvatarService,
    private readonly assignment: CharacterAvatarAssignment,
    private readonly clock: CharacterClock,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: DomainEventPublisher,
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
      throw new CharacterApplicationError({
        reason: 'not-found',
        params: { characterId: command.id },
      });
    }

    const avatar = await this.avatars.createAvatar(command);
    const nowMs = this.clock.now().getTime();
    const assignment = await this.unitOfWork.run(async () => {
      const result = await this.assignment.replace({
        characterId: character.id,
        ownerUserId: command.ownerUserId,
        resourceId: avatar.resourceId,
        nowMs,
      });
      if (result && result.previousResourceId !== avatar.resourceId) {
        await this.avatars.activate(avatar.resourceId, command.ownerUserId);
        if (result.previousResourceId) {
          await this.avatars.release(
            result.previousResourceId,
            command.ownerUserId,
            nowMs,
          );
        }
        await this.events.publish(
          new CharacterAvatarChangedEvent({
            characterId: character.id,
            ownerUserId: command.ownerUserId,
            previousResourceId: result.previousResourceId,
            currentResourceId: avatar.resourceId,
            occurredAtMs: nowMs,
          }),
        );
      }
      return result;
    });
    if (!assignment) {
      throw new CharacterApplicationError({
        reason: 'not-found',
        params: { characterId: command.id },
      });
    }
    return assignment.character;
  }
}
