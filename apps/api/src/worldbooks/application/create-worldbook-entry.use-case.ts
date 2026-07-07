import { countPromptTokens } from "@rolesta/shared";
import { ensureEpochMillis } from "../../characters/domain/epoch-millis.js";
import type {
  WorldbookCharacterFilter,
  WorldbookConditionLogic,
  WorldbookDepthRole,
  Worldbook,
  WorldbookEntry,
  WorldbookGenerationTrigger,
  WorldbookInsertionPosition,
  WorldbookTriState,
} from "../domain/worldbook.js";
import { WorldbookApplicationError } from "./worldbook-application-error.js";
import type {
  WorldbookClock,
  WorldbookIdGenerator,
} from "./worldbook-application-services.js";
import type { WorldbookStore } from "./worldbook-store.js";

export interface CreateWorldbookEntryCommand {
  worldbookId: string;
  viewerUserId: string;
  externalUid?: number | null;
  enabled?: boolean;
  name: string;
  addMemo?: boolean;
  comment?: string;
  content: string;
  primaryKeys?: string[];
  secondaryKeys?: string[];
  conditionLogic?: WorldbookConditionLogic;
  selective?: boolean;
  constant?: boolean;
  vectorized?: boolean;
  caseSensitive?: WorldbookTriState;
  matchWholeWords?: WorldbookTriState;
  insertionPosition?: WorldbookInsertionPosition;
  depthRole?: WorldbookDepthRole;
  insertionDepth?: number;
  insertionOrder?: number;
  displayOrder?: number;
  useProbability?: boolean;
  probability?: number;
  scanDepth?: number | null;
  recursiveScan?: boolean;
  preventFurtherRecursion?: boolean;
  delayUntilRecursion?: boolean;
  recursionDelayLevel?: number | null;
  ignoreBudget?: boolean;
  group?: string;
  groupOverride?: boolean;
  groupWeight?: number;
  useGroupScoring?: WorldbookTriState;
  sticky?: number | null;
  cooldown?: number | null;
  delay?: number | null;
  matchPersonaDescription?: boolean;
  matchCharacterDescription?: boolean;
  matchCharacterPersonality?: boolean;
  matchScenario?: boolean;
  matchCreatorNotes?: boolean;
  matchCharacterDepthPrompt?: boolean;
  automationId?: string;
  generationTriggers?: WorldbookGenerationTrigger[];
  outletName?: string;
  characterFilter?: WorldbookCharacterFilter;
}

export class CreateWorldbookEntryUseCase {
  constructor(
    private readonly store: WorldbookStore,
    private readonly idGenerator: WorldbookIdGenerator,
    private readonly clock: WorldbookClock,
  ) {}

  async execute(command: CreateWorldbookEntryCommand): Promise<Worldbook> {
    const current = await this.store.findVisibleById(
      command.worldbookId,
      command.viewerUserId,
    );

    if (current === null) {
      throw new WorldbookApplicationError("not-found");
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new WorldbookApplicationError("forbidden");
    }

    const nowMs = ensureEpochMillis(this.clock.now().getTime());
    const nextOrder =
      command.insertionOrder ??
      current.entries.reduce(
        (max, entry) => Math.max(max, entry.insertionOrder),
        -1,
      ) + 1;
    const entry: WorldbookEntry = {
      id: this.idGenerator.createId(),
      worldbookId: current.id,
      externalUid: command.externalUid ?? null,
      enabled: command.enabled ?? true,
      name: command.name,
      addMemo: command.addMemo ?? true,
      comment: command.comment ?? "",
      content: command.content,
      primaryKeys: command.primaryKeys ?? [],
      secondaryKeys: command.secondaryKeys ?? [],
      conditionLogic: command.conditionLogic ?? "andAny",
      selective: command.selective ?? false,
      constant: command.constant ?? false,
      vectorized: command.vectorized ?? false,
      caseSensitive: command.caseSensitive ?? "inherit",
      matchWholeWords: command.matchWholeWords ?? "inherit",
      insertionPosition:
        command.insertionPosition ?? "beforeCharacterDefinition",
      depthRole: command.depthRole ?? "system",
      insertionDepth: command.insertionDepth ?? current.scanDepth,
      insertionOrder: nextOrder,
      displayOrder: command.displayOrder ?? nextOrder,
      useProbability: command.useProbability ?? true,
      probability: command.probability ?? 100,
      scanDepth: command.scanDepth ?? null,
      recursiveScan: command.recursiveScan ?? true,
      preventFurtherRecursion: command.preventFurtherRecursion ?? false,
      delayUntilRecursion: command.delayUntilRecursion ?? false,
      recursionDelayLevel: command.recursionDelayLevel ?? null,
      ignoreBudget: command.ignoreBudget ?? false,
      group: command.group ?? "",
      groupOverride: command.groupOverride ?? false,
      groupWeight: command.groupWeight ?? 100,
      useGroupScoring: command.useGroupScoring ?? "inherit",
      sticky: "sticky" in command ? command.sticky! : 0,
      cooldown: "cooldown" in command ? command.cooldown! : 0,
      delay: "delay" in command ? command.delay! : 0,
      matchPersonaDescription: command.matchPersonaDescription ?? false,
      matchCharacterDescription: command.matchCharacterDescription ?? false,
      matchCharacterPersonality: command.matchCharacterPersonality ?? false,
      matchScenario: command.matchScenario ?? false,
      matchCreatorNotes: command.matchCreatorNotes ?? false,
      matchCharacterDepthPrompt: command.matchCharacterDepthPrompt ?? false,
      automationId: command.automationId ?? "",
      generationTriggers: command.generationTriggers ?? [],
      outletName: command.outletName ?? "",
      characterFilter: command.characterFilter ?? {
        isExclude: false,
        names: [],
        tags: [],
      },
      tokenCount: countPromptTokens(command.content),
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    };
    const updated = {
      ...current,
      entries: [...current.entries, entry],
      updatedAtMs: nowMs,
    };

    await this.store.update(updated);

    return updated;
  }
}
