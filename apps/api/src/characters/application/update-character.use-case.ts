import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { UseCase } from '../../common/errors/index.js';
import type { DomainEventPublisher } from '../../common/events/index.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { CharacterCard } from '../domain/character-card.js';
import { CharacterVisibilityChangedEvent } from '../events/index.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';
import { CharacterApplicationError } from './character-application-error.js';
import {
  applyCharacterCardEditableFields,
  type CharacterCardEditableFields,
} from './character-card-editable-fields.js';
import type { CharacterClock } from './character-application-services.js';
import { translateCharacterError } from './character-error.mapper.js';

export interface UpdateCharacterCommand extends CharacterCardEditableFields {
  id: string;
  viewerUserId: string;
}

export class UpdateCharacterUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly clock: CharacterClock,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: DomainEventPublisher,
  ) {}

  @UseCase(translateCharacterError)
  execute(command: UpdateCharacterCommand): Promise<CharacterCard> {
    return this.unitOfWork.run(async () => {
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

      const occurredAtMs = ensureEpochMillis(this.clock.now().getTime());
      const updated = applyCharacterCardEditableFields(
        { ...current, updatedAtMs: occurredAtMs },
        command,
      );
      await this.store.update(updated);

      if (current.visibility === 'public' && updated.visibility === 'private') {
        await this.events.publish(
          new CharacterVisibilityChangedEvent({
            characterId: current.id,
            ownerUserId: current.ownerUserId,
            occurredAtMs,
          }),
        );
      }
      return updated;
    });
  }
}
