import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { Worldbook, WorldbookEntry } from '../domain/worldbook.js';
import type { WorldbookStore } from '../ports/worldbook-store.js';
import { translateWorldbookError } from './worldbook-error.mapper.js';
import { WorldbookApplicationError } from './worldbook-application-error.js';
import type { WorldbookClock } from './worldbook-application-services.js';

export interface UpdateWorldbookEntryOrderCommand {
  worldbookId: string;
  viewerUserId: string;
  entries: Array<{
    entryId: string;
    enabled: boolean;
  }>;
}

export class UpdateWorldbookEntryOrderUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly clock: WorldbookClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: UpdateWorldbookEntryOrderCommand): Promise<Worldbook> {
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

      const entryIds = new Set<string>();

      for (const item of command.entries) {
        if (entryIds.has(item.entryId)) {
          throw new WorldbookApplicationError({
            reason: 'duplicate-entry',
            params: {
              worldbookId: command.worldbookId,
              entryId: item.entryId,
            },
          });
        }

        entryIds.add(item.entryId);

        if (!current.entries.some((entry) => entry.id === item.entryId)) {
          throw new WorldbookApplicationError({
            reason: 'unknown-entry',
            params: {
              worldbookId: command.worldbookId,
              entryId: item.entryId,
            },
          });
        }
      }

      if (entryIds.size !== current.entries.length) {
        throw new WorldbookApplicationError({
          reason: 'unknown-entry',
          params: { worldbookId: command.worldbookId },
        });
      }

      const nowMs = ensureEpochMillis(this.clock.now().getTime());
      const entryById = new Map(current.entries.map((entry) => [entry.id, entry]));
      const orderedEntries: WorldbookEntry[] = command.entries.map((item, index) => ({
        ...entryById.get(item.entryId)!,
        enabled: item.enabled,
        insertionOrder: index,
        updatedAtMs: nowMs,
      }));

      const updated = {
        ...current,
        entries: orderedEntries,
        updatedAtMs: nowMs,
      };

      await this.store.update(updated);

      return updated;
    });
  }
}
