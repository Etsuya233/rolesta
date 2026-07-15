import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import type { DomainEventPublisher } from '../../common/events/index.js';
import { CharacterApplicationError } from './character-application-error.js';
import type { CharacterClock } from './character-application-services.js';
import { translateCharacterError } from './character-error.mapper.js';
import { CharacterDeletedEvent } from '../events/index.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';
import type { CharacterAvatarService } from '../ports/character-avatar-service.js';

export interface DeleteCharacterCommand {
  id: string;
  viewerUserId: string;
}

export class DeleteCharacterUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly avatars: CharacterAvatarService,
    private readonly clock: CharacterClock,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: DomainEventPublisher,
  ) {}

  @UseCase(translateCharacterError)
  async execute(command: DeleteCharacterCommand): Promise<void> {
    await this.unitOfWork.run(async () => {
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

      const deleted = await this.store.deleteOwned(command.id, command.viewerUserId);
      if (!deleted) {
        throw new CharacterApplicationError({
          reason: 'not-found',
          params: { characterId: command.id },
        });
      }

      const occurredAtMs = this.clock.now().getTime();
      if (current.avatarResourceId) {
        await this.avatars.release(current.avatarResourceId, current.ownerUserId, occurredAtMs);
      }

      await this.events.publish(
        new CharacterDeletedEvent({
          characterId: current.id,
          ownerUserId: current.ownerUserId,
          occurredAtMs,
        }),
      );
    });
  }
}
