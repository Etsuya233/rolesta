import { ensureEpochMillis } from "../../characters/domain/epoch-millis.js";
import type { Worldbook } from "../domain/worldbook.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type { WorldbookClock } from "./worldbook-application-services.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface DeleteWorldbookEntryCommand {
  worldbookId: string;
  entryId: string;
  viewerUserId: string;
}

export class DeleteWorldbookEntryUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly clock: WorldbookClock,
  ) {}

  async execute(command: DeleteWorldbookEntryCommand): Promise<Worldbook> {
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

    if (!current.entries.some((entry) => entry.id === command.entryId)) {
      throw new WorldbookApplicationError("unknown-entry");
    }

    const updated = {
      ...current,
      entries: current.entries.filter((entry) => entry.id !== command.entryId),
      updatedAtMs: ensureEpochMillis(this.clock.now().getTime()),
    };

    await this.store.update(updated);

    return updated;
  }
}
