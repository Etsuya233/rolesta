import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { Worldbook } from '../domain/worldbook.js';
import type { WorldbookStore } from '../ports/worldbook-store.js';
import { translateWorldbookError } from './worldbook-error.mapper.js';
import { WorldbookApplicationError } from './worldbook-application-error.js';
import type { WorldbookClock } from './worldbook-application-services.js';

export interface DeleteWorldbookEntryCommand {
  worldbookId: string;
  entryId: string;
  viewerUserId: string;
}

export class DeleteWorldbookEntryUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly clock: WorldbookClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: DeleteWorldbookEntryCommand): Promise<Worldbook> {
    return this.unitOfWork.run(async () => {
      const current = await this.store.findVisibleById(command.worldbookId, command.viewerUserId);

      if (current === null) {
        throw new WorldbookApplicationError({
          reason: 'not-found',
          params: { worldbookId: command.worldbookId },
        });
      }

      if (current.ownerUserId !== command.viewerUserId) {
        throw new WorldbookApplicationError({
          reason: 'forbidden',
          params: {
            worldbookId: command.worldbookId,
            viewerUserId: command.viewerUserId,
          },
        });
      }

      if (!current.entries.some((entry) => entry.id === command.entryId)) {
        throw new WorldbookApplicationError({
          reason: 'unknown-entry',
          params: {
            worldbookId: command.worldbookId,
            entryId: command.entryId,
          },
        });
      }

      const updated = {
        ...current,
        entries: current.entries.filter((entry) => entry.id !== command.entryId),
        updatedAtMs: ensureEpochMillis(this.clock.now().getTime()),
      };

      await this.store.update(updated);

      return updated;
    });
  }
}
