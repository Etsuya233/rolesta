import { countPromptTokens } from "@rolesta/shared";
import { UseCase } from "../../common/errors/index.js";
import { ensureEpochMillis } from "../../shared/epoch-millis.js";
import type {
  Worldbook,
  WorldbookEntryRole,
  WorldbookEntry,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
} from "../domain/worldbook.js";
import { translateWorldbookError } from "./worldbook-error.mapper.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type {
  WorldbookClock,
  WorldbookIdGenerator,
} from "./worldbook-application-services.js";
import type { WorldbookStore } from "../ports/worldbook-store.js";

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
  selectiveLogic?: WorldbookSelectiveLogic;
  constant?: boolean;
  vectorized?: boolean;
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  insertionPosition?: WorldbookInsertionPosition;
  insertionOrder?: number;
  depth?: number;
  insertionRole?: WorldbookEntryRole;
  anchorName?: string;
  scanDepth?: number | null;
  excludeRecursion?: boolean;
  preventRecursion?: boolean;
  delayUntilRecursion?: boolean;
  probability?: number;
}

export class CreateWorldbookEntryUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: CreateWorldbookEntryCommand): Promise<Worldbook> {
    const current = await this.store.findVisibleById(
      command.worldbookId,
      command.viewerUserId,
    );

    if (current === null) {
      throw new WorldbookApplicationError({
        reason: "not-found",
        params: { worldbookId: command.worldbookId },
      });
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new WorldbookApplicationError({
        reason: "forbidden",
        params: {
          worldbookId: command.worldbookId,
          viewerUserId: command.viewerUserId,
        },
      });
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
      selectiveLogic: command.selectiveLogic ?? "andAny",
      constant: command.constant ?? false,
      vectorized: command.vectorized ?? false,
      caseSensitive: command.caseSensitive ?? false,
      matchWholeWords: command.matchWholeWords ?? false,
      insertionPosition:
        command.insertionPosition ?? "beforeCharacterDefinition",
      insertionOrder: nextOrder,
      depth: command.depth ?? current.scanDepth,
      insertionRole: command.insertionRole ?? "system",
      anchorName: command.anchorName ?? "",
      scanDepth: command.scanDepth === undefined ? null : command.scanDepth,
      excludeRecursion: command.excludeRecursion ?? false,
      preventRecursion: command.preventRecursion ?? false,
      delayUntilRecursion: command.delayUntilRecursion ?? false,
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
