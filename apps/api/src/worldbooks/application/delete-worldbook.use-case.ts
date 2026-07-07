import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface DeleteWorldbookCommand {
  id: string;
  viewerUserId: string;
}

export class DeleteWorldbookUseCase {
  constructor(private readonly store: WorldbookStore) {}

  async execute(command: DeleteWorldbookCommand): Promise<void> {
    const current = await this.store.findVisibleById(
      command.id,
      command.viewerUserId,
    );

    if (current === null) {
      throw new WorldbookApplicationError("not-found");
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new WorldbookApplicationError("forbidden");
    }

    await this.store.deleteOwned(command.id, command.viewerUserId);
  }
}
