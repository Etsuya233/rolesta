import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { Worldbook } from '../domain/worldbook.js';
import type { WorldbookStore } from '../ports/worldbook-store.js';
import { translateWorldbookError } from './worldbook-error.mapper.js';
import { WorldbookApplicationError } from './worldbook-application-error.js';
import type { WorldbookClock } from './worldbook-application-services.js';
import {
  applyWorldbookEditableFields,
  type WorldbookEditableFields,
} from './worldbook-editable-fields.js';

export interface UpdateWorldbookCommand extends WorldbookEditableFields {
  id: string;
  viewerUserId: string;
}

export class UpdateWorldbookUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly clock: WorldbookClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: UpdateWorldbookCommand): Promise<Worldbook> {
    return this.unitOfWork.run(async () => {
      const current = await this.store.findVisibleById(command.id, command.viewerUserId);

      if (current === null) {
        throw new WorldbookApplicationError({
          reason: 'not-found',
          params: { worldbookId: command.id },
        });
      }

      if (current.ownerUserId !== command.viewerUserId) {
        throw new WorldbookApplicationError({
          reason: 'forbidden',
          params: {
            worldbookId: command.id,
            viewerUserId: command.viewerUserId,
          },
        });
      }

      const updated = applyWorldbookEditableFields(
        {
          ...current,
          updatedAtMs: ensureEpochMillis(this.clock.now().getTime()),
        },
        command,
      );

      await this.store.update(updated);

      return updated;
    });
  }
}
