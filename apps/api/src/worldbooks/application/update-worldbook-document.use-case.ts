import { countPromptTokens } from "@rolesta/shared";
import { UseCase } from "../../common/errors/index.js";
import type { UnitOfWork } from "../../common/application/unit-of-work.js";
import { ensureEpochMillis } from "../../shared/epoch-millis.js";
import type {
  Worldbook,
  WorldbookEntryRole,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
  WorldbookVisibility,
} from "../domain/worldbook.js";
import type { WorldbookStore } from "../ports/worldbook-store.js";
import type {
  WorldbookClock,
  WorldbookIdGenerator,
} from "./worldbook-application-services.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import { translateWorldbookError } from "./worldbook-error.mapper.js";

export interface WorldbookDocumentEntry {
  id: string;
  enabled: boolean;
  name: string;
  comment: string;
  content: string;
  primaryKeys: string[];
  secondaryKeys: string[];
  selective: boolean;
  selectiveLogic: WorldbookSelectiveLogic;
  constant: boolean;
  vectorized: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  insertionPosition: WorldbookInsertionPosition;
  depth: number;
  insertionRole: WorldbookEntryRole;
  anchorName: string;
  scanDepth: number | null;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: boolean;
  probability: number;
}

export interface UpdateWorldbookDocumentCommand {
  worldbookId: string;
  viewerUserId: string;
  visibility: WorldbookVisibility;
  name: string;
  description: string;
  tags: string[];
  scanDepth: number;
  tokenBudget: number;
  recursiveScan: boolean;
  entries: WorldbookDocumentEntry[];
}

export class UpdateWorldbookDocumentUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: UpdateWorldbookDocumentCommand): Promise<Worldbook> {
    return this.unitOfWork.run(async () => {
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

      assertUniqueEntryIds(command.worldbookId, command.entries);

      const nowMs = ensureEpochMillis(this.clock.now().getTime());
      const currentEntryById = new Map(
        current.entries.map((entry) => [entry.id, entry]),
      );
      const entries = command.entries.map((entry, insertionOrder) => {
        const existing = currentEntryById.get(entry.id);

        return {
          ...entry,
          id: existing?.id ?? this.idGenerator.createId(),
          worldbookId: current.id,
          insertionOrder,
          tokenCount: countPromptTokens(entry.content),
          createdAtMs: existing?.createdAtMs ?? nowMs,
          updatedAtMs: nowMs,
        };
      });
      const updated: Worldbook = {
        ...current,
        visibility: command.visibility,
        name: command.name,
        description: command.description,
        tags: command.tags,
        scanDepth: command.scanDepth,
        tokenBudget: command.tokenBudget,
        recursiveScan: command.recursiveScan,
        entries,
        updatedAtMs: nowMs,
      };

      await this.store.update(updated);
      return updated;
    });
  }
}

function assertUniqueEntryIds(
  worldbookId: string,
  entries: WorldbookDocumentEntry[],
): void {
  const entryIds = new Set<string>();

  for (const entry of entries) {
    if (entryIds.has(entry.id)) {
      throw new WorldbookApplicationError({
        reason: "duplicate-entry",
        params: { worldbookId, entryId: entry.id },
      });
    }

    entryIds.add(entry.id);
  }
}
