import { UseCase } from '../../common/errors/use-case.decorator.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import type { DomainEventPublisher } from '../../common/events/index.js';
import type { CharacterClock } from './character-application-services.js';
import { CharacterApplicationError } from './character-application-error.js';
import { translateCharacterError } from './character-error.mapper.js';
import type { CharacterAvatarAssignment } from '../ports/character-avatar-assignment.js';
import type { CharacterAvatarService } from '../ports/character-avatar-service.js';
import { CharacterAvatarChangedEvent } from '../events/index.js';

export class DeleteCharacterAvatarUseCase {
  constructor(
    private readonly assignment: CharacterAvatarAssignment,
    private readonly avatars: CharacterAvatarService,
    private readonly clock: CharacterClock,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: DomainEventPublisher,
  ) {}

  @UseCase(translateCharacterError)
  async execute(id: string, ownerUserId: string): Promise<void> {
    const nowMs = this.clock.now().getTime();
    const assignment = await this.unitOfWork.run(async () => {
      const result = await this.assignment.remove({
        characterId: id,
        ownerUserId,
        nowMs,
      });
      if (result?.previousResourceId) {
        await this.avatars.release(result.previousResourceId, ownerUserId, nowMs);
        await this.events.publish(
          new CharacterAvatarChangedEvent({
            characterId: id,
            ownerUserId,
            previousResourceId: result.previousResourceId,
            currentResourceId: null,
            occurredAtMs: nowMs,
          }),
        );
      }
      return result;
    });
    if (!assignment) {
      throw new CharacterApplicationError({
        reason: 'not-found',
        params: { characterId: id },
      });
    }
  }
}
