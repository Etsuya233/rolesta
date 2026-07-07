import { ensureEpochMillis } from "../../characters/domain/epoch-millis.js";
import type { Worldbook, WorldbookEntry } from "../domain/worldbook.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type { WorldbookClock } from "./worldbook-application-services.js";
import type { WorldbookStore } from "./worldbook-store.js";

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
  ) {}

  async execute(command: UpdateWorldbookEntryOrderCommand): Promise<Worldbook> {
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

    const entryIds = new Set<string>();

    for (const item of command.entries) {
      if (entryIds.has(item.entryId)) {
        throw new WorldbookApplicationError("duplicate-entry");
      }

      entryIds.add(item.entryId);

      if (!current.entries.some((entry) => entry.id === item.entryId)) {
        throw new WorldbookApplicationError("unknown-entry");
      }
    }

    if (entryIds.size !== current.entries.length) {
      throw new WorldbookApplicationError("unknown-entry");
    }

    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const entryById = new Map(
      current.entries.map((entry) => [entry.id, entry]),
    );
    const orderedEntries: WorldbookEntry[] = command.entries.map(
      (item, index) => ({
        ...entryById.get(item.entryId)!,
        enabled: item.enabled,
        displayOrder: index,
        updatedAtMs: nowMs,
      }),
    );

    const updated = { ...current, entries: orderedEntries, updatedAtMs: nowMs };

    await this.store.update(updated);

    return updated;
  }
}
