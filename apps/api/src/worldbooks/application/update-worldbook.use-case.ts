import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { Worldbook } from "../domain/worldbook.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type { WorldbookClock } from "./worldbook-application-services.js";
import {
  applyWorldbookEditableFields,
  type WorldbookEditableFields,
} from "./worldbook-editable-fields.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface UpdateWorldbookCommand extends WorldbookEditableFields {
  id: string;
  viewerUserId: string;
}

export class UpdateWorldbookUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly clock: WorldbookClock,
  ) {}

  async execute(command: UpdateWorldbookCommand): Promise<Worldbook> {
    const current = await this.store.findVisibleById(
      command.id,
      command.viewerUserId,
    );

    if (current === null) {
      throw new WorldbookApplicationError("not-found");
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new WorldbookApplicationError("forbidden");
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
  }
}
