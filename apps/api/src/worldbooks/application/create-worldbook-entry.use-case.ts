import { countPromptTokens } from "@rolesta/shared";
import { ensureEpochMillis } from "../../characters/domain/epoch-millis.js";
import type {
  Worldbook,
  WorldbookEntry,
  WorldbookInsertionPosition,
} from "../domain/worldbook.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type {
  WorldbookClock,
  WorldbookIdGenerator,
} from "./worldbook-application-services.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface CreateWorldbookEntryCommand {
  worldbookId: string;
  viewerUserId: string;
  enabled?: boolean;
  name: string;
  comment?: string;
  content: string;
  primaryKeys?: string[];
  secondaryKeys?: string[];
  selective?: boolean;
  constant?: boolean;
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  insertionPosition?: WorldbookInsertionPosition;
  insertionOrder?: number;
  depth?: number;
  probability?: number;
}

export class CreateWorldbookEntryUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
  ) {}

  async execute(command: CreateWorldbookEntryCommand): Promise<Worldbook> {
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
    const nextOrder =
      command.insertionOrder ??
      current.entries.reduce(
        (max, entry) => Math.max(max, entry.insertionOrder),
        -1,
      ) + 1;
    const entry: WorldbookEntry = {
      id: this.idGenerator.createId(),
      worldbookId: current.id,
      enabled: command.enabled ?? true,
      name: command.name,
      comment: command.comment ?? "",
      content: command.content,
      primaryKeys: command.primaryKeys ?? [],
      secondaryKeys: command.secondaryKeys ?? [],
      selective: command.selective ?? false,
      constant: command.constant ?? false,
      caseSensitive: command.caseSensitive ?? false,
      matchWholeWords: command.matchWholeWords ?? false,
      insertionPosition: command.insertionPosition ?? "beforeChar",
      insertionOrder: nextOrder,
      depth: command.depth ?? current.scanDepth,
      probability: command.probability ?? 100,
      tokenCount: countPromptTokens(command.content),
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    };
    const updated = {
      ...current,
      entries: [...current.entries, entry],
      updatedAtMs: nowMs,
    };

    await this.store.update(updated);

    return updated;
  }
}
