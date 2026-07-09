import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { Worldbook } from "../domain/worldbook.js";
import type {
  WorldbookClock,
  WorldbookIdGenerator,
} from "./worldbook-application-services.js";
import {
  applyWorldbookEditableFields,
  type WorldbookEditableFields,
} from "./worldbook-editable-fields.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface CreateWorldbookCommand extends WorldbookEditableFields {
  ownerUserId: string;
}

export class CreateWorldbookUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
  ) {}

  async execute(command: CreateWorldbookCommand): Promise<Worldbook> {
    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const draft: Worldbook = {
      id: this.idGenerator.createId(),
      ownerUserId: command.ownerUserId,
      visibility: "private",
      name: "Untitled worldbook",
      description: "",
      tags: [],
      scanDepth: 3,
      tokenBudget: 1024,
      recursiveScan: false,
      entries: [],
      sourceFormat: "rolesta",
      sourceSnapshot: {},
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
      lastUsedAtMs: null,
      usageCount: 0,
    };
    const worldbook = applyWorldbookEditableFields(draft, command);

    await this.store.save(worldbook);

    return worldbook;
  }
}
