import { UseCase } from "../../common/errors/index.js";
import type { WorldbookCodec } from "../ports/worldbook-codec.js";
import type { WorldbookStore } from "../ports/worldbook-store.js";
import { translateWorldbookError } from "./worldbook-error.mapper.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";

export interface ExportWorldbookCommand {
  id: string;
  viewerUserId: string;
}

export class ExportWorldbookUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly codec: WorldbookCodec,
  ) {}

  @UseCase(translateWorldbookError)
  async execute(command: ExportWorldbookCommand): Promise<object> {
    const worldbook = await this.store.findVisibleById(
      command.id,
      command.viewerUserId,
    );

    if (worldbook === null) {
      throw new WorldbookApplicationError({
        reason: "not-found",
        params: { worldbookId: command.id },
      });
    }

    if (worldbook.ownerUserId !== command.viewerUserId) {
      throw new WorldbookApplicationError({
        reason: "forbidden",
        params: {
          worldbookId: command.id,
          viewerUserId: command.viewerUserId,
        },
      });
    }

    return this.codec.exportWorldbook(worldbook);
  }
}
