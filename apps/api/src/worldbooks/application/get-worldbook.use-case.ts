import { UseCase } from "../../common/errors/index.js";
import type { Worldbook } from "../domain/worldbook.js";
import type { WorldbookStore } from "../ports/worldbook-store.js";
import { translateWorldbookError } from "./worldbook-error.mapper.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";

export interface GetWorldbookCommand {
  id: string;
  viewerUserId: string;
}

export class GetWorldbookUseCase {
  constructor(private readonly store: WorldbookStore) {}

  @UseCase(translateWorldbookError)
  async execute(command: GetWorldbookCommand): Promise<Worldbook> {
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

    return worldbook;
  }
}
