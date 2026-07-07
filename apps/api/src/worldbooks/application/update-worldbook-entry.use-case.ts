import { ensureEpochMillis } from "../../characters/domain/epoch-millis.js";
import type { Worldbook } from "../domain/worldbook.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type { WorldbookClock } from "./worldbook-application-services.js";
import {
  applyWorldbookEntryEditableFields,
  type WorldbookEntryEditableFields,
} from "./worldbook-entry-editable-fields.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface UpdateWorldbookEntryCommand extends WorldbookEntryEditableFields {
  worldbookId: string;
  entryId: string;
  viewerUserId: string;
}

export class UpdateWorldbookEntryUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly clock: WorldbookClock,
  ) {}

  async execute(command: UpdateWorldbookEntryCommand): Promise<Worldbook> {
    const current = await this.store.findVisibleById(
      command.worldbookId,
      command.viewerUserId,
    );

    if (current === null) {
      throw new WorldbookApplicationError("not-found");
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new WorldbookApplicationError("forbidden");
    }

    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    let found = false;
    const entries = current.entries.map((entry) => {
      if (entry.id !== command.entryId) {
        return entry;
      }

      found = true;
      return applyWorldbookEntryEditableFields(
        { ...entry, updatedAtMs: nowMs },
        command,
      );
    });

    if (!found) {
      throw new WorldbookApplicationError("unknown-entry");
    }

    const updated = { ...current, entries, updatedAtMs: nowMs };

    await this.store.update(updated);

    return updated;
  }
}
