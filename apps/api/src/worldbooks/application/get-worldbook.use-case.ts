import type { Worldbook } from "../domain/worldbook.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface GetWorldbookCommand {
  id: string;
  viewerUserId: string;
}

export class GetWorldbookUseCase {
  constructor(private readonly store: WorldbookStore) {}

  async execute(command: GetWorldbookCommand): Promise<Worldbook> {
    const worldbook = await this.store.findVisibleById(
      command.id,
      command.viewerUserId,
    );

    if (worldbook === null) {
      throw new WorldbookApplicationError("not-found");
    }

    return worldbook;
  }
}
