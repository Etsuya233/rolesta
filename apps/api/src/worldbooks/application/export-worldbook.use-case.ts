import {
  toSillyTavernWorldInfo,
  type SillyTavernWorldInfoOutput,
} from "../infrastructure/silly-tavern-world-info.mapper.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface ExportWorldbookCommand {
  id: string;
  viewerUserId: string;
}

export class ExportWorldbookUseCase {
  constructor(private readonly store: WorldbookStore) {}

  async execute(
    command: ExportWorldbookCommand,
  ): Promise<SillyTavernWorldInfoOutput> {
    const worldbook = await this.store.findVisibleById(
      command.id,
      command.viewerUserId,
    );

    if (worldbook === null) {
      throw new WorldbookApplicationError("not-found");
    }

    if (worldbook.ownerUserId !== command.viewerUserId) {
      throw new WorldbookApplicationError("forbidden");
    }

    return toSillyTavernWorldInfo(worldbook);
  }
}
