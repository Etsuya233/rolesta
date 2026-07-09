import { UseCase } from "../../common/errors/index.js";
import type { WorldbookStore } from "../ports/worldbook-store.js";
import { translateWorldbookError } from "./worldbook-error.mapper.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";

export interface DeleteWorldbookCommand {
  id: string;
  viewerUserId: string;
}

export class DeleteWorldbookUseCase {
  constructor(private readonly store: WorldbookStore) {}

  @UseCase(translateWorldbookError)
  async execute(command: DeleteWorldbookCommand): Promise<void> {
    const current = await this.store.findVisibleById(
      command.id,
      command.viewerUserId,
    );

    if (current === null) {
      throw new WorldbookApplicationError({
        reason: "not-found",
        params: { worldbookId: command.id },
      });
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new WorldbookApplicationError({
        reason: "forbidden",
        params: {
          worldbookId: command.id,
          viewerUserId: command.viewerUserId,
        },
      });
    }

    await this.store.deleteOwned(command.id, command.viewerUserId);
  }
}
