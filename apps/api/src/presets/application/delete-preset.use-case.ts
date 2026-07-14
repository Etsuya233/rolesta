import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import type { DomainEventPublisher } from '../../common/events/index.js';
import { PresetApplicationError } from './preset-application-error.js';
import type { PresetClock } from './preset-application-services.js';
import { translatePresetError } from './preset-error.mapper.js';
import { PresetDeletedEvent } from '../events/index.js';
import type { PresetStore } from '../ports/preset-store.js';

export interface DeletePresetCommand {
  id: string;
  viewerUserId: string;
}

export class DeletePresetUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: DomainEventPublisher,
  ) {}

  @UseCase(translatePresetError)
  async execute(command: DeletePresetCommand): Promise<void> {
    await this.unitOfWork.run(async () => {
      const deleted = await this.store.deleteOwned(command.id, command.viewerUserId);

      if (!deleted) {
        throw new PresetApplicationError({
          reason: 'not-found',
          params: {
            presetId: command.id,
          },
        });
      }

      await this.events.publish(
        new PresetDeletedEvent({
          presetId: command.id,
          ownerUserId: command.viewerUserId,
          occurredAtMs: this.clock.now().getTime(),
        }),
      );
    });
  }
}
