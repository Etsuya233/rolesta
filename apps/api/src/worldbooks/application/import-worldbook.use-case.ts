import { ensureEpochMillis } from "../../characters/domain/epoch-millis.js";
import type { Worldbook } from "../domain/worldbook.js";
import { fromSillyTavernWorldInfo } from "../infrastructure/silly-tavern-world-info.mapper.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type {
  WorldbookClock,
  WorldbookIdGenerator,
} from "./worldbook-application-services.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface ImportWorldbookCommand {
  ownerUserId: string;
  fileName: string;
  content: Buffer;
}

export class ImportWorldbookUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
  ) {}

  async execute(command: ImportWorldbookCommand): Promise<Worldbook> {
    const input = this.readJson(command.content);
    const imported = fromSillyTavernWorldInfo(input, command.fileName);
    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const worldbookId = this.idGenerator.createId();
    const worldbook: Worldbook = {
      id: worldbookId,
      ownerUserId: command.ownerUserId,
      visibility: "private",
      name: imported.name,
      description: imported.description,
      tags: imported.tags,
      scanDepth: imported.scanDepth,
      tokenBudget: imported.tokenBudget,
      recursiveScan: imported.recursiveScan,
      entries: imported.entries.map((entry) => ({
        ...entry,
        id: this.idGenerator.createId(),
        worldbookId,
        createdAtMs: nowMs,
        updatedAtMs: nowMs,
      })),
      sourceFormat: "sillytavern_world_info",
      sourceSnapshot: imported.sourceSnapshot,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      lastUsedAtMs: null,
      usageCount: 0,
    };

    await this.store.save(worldbook);

    return worldbook;
  }

  private readJson(content: Buffer): unknown {
    try {
      return JSON.parse(content.toString("utf8")) as unknown;
    } catch {
      throw new WorldbookApplicationError("invalid-import-file");
    }
  }
}
