import { UseCase } from "../../common/errors/index.js";
import type { UnitOfWork } from "../../common/application/unit-of-work.js";
import { ensureEpochMillis } from "../../shared/epoch-millis.js";
import type { Worldbook } from "../domain/worldbook.js";
import type { WorldbookCodec } from "../ports/worldbook-codec.js";
import type { WorldbookStore } from "../ports/worldbook-store.js";
import { translateWorldbookError } from "./worldbook-error.mapper.js";
import type {
  WorldbookClock,
  WorldbookIdGenerator,
} from "./worldbook-application-services.js";

export interface ImportWorldbookCommand {
  ownerUserId: string;
  fileName: string;
  content: Buffer;
}

export class ImportWorldbookUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly codec: WorldbookCodec,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: ImportWorldbookCommand): Promise<Worldbook> {
    const imported = this.codec.importFile({
      fileName: command.fileName,
      content: command.content,
    });
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

    await this.unitOfWork.run(() => this.store.save(worldbook));

    return worldbook;
  }
}
