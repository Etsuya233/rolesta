import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { Worldbook } from '../domain/worldbook.js';
import type { WorldbookStore } from '../ports/worldbook-store.js';
import { translateWorldbookError } from './worldbook-error.mapper.js';
import { WorldbookApplicationError } from './worldbook-application-error.js';
import type { WorldbookClock } from './worldbook-application-services.js';
import {
  applyWorldbookEntryEditableFields,
  type WorldbookEntryEditableFields,
} from './worldbook-entry-editable-fields.js';

export interface UpdateWorldbookEntryCommand extends WorldbookEntryEditableFields {
  worldbookId: string;
  entryId: string;
  viewerUserId: string;
}

export class UpdateWorldbookEntryUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly clock: WorldbookClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: UpdateWorldbookEntryCommand): Promise<Worldbook> {
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

      const nowMs = ensureEpochMillis(this.clock.now().getTime());
      let found = false;
      const entries = current.entries.map((entry) => {
        if (entry.id !== command.entryId) {
          return entry;
        }

        found = true;
        return applyWorldbookEntryEditableFields({ ...entry, updatedAtMs: nowMs }, command);
      });

      if (!found) {
        throw new WorldbookApplicationError({
          reason: 'unknown-entry',
          params: {
            worldbookId: command.worldbookId,
            entryId: command.entryId,
          },
        });
      }

      const updated = { ...current, entries, updatedAtMs: nowMs };

      await this.store.update(updated);

      return updated;
    });
  }
}
