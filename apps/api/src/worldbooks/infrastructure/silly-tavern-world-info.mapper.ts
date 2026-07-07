import { countPromptTokens } from "@rolesta/shared";
import { WorldbookApplicationError } from "../application/worldbook-application-error.js";
import type {
  Worldbook,
  WorldbookCharacterFilter,
  WorldbookConditionLogic,
  WorldbookDepthRole,
  WorldbookEntry,
  WorldbookGenerationTrigger,
  WorldbookInsertionPosition,
  WorldbookTriState,
} from "../domain/worldbook.js";

export interface ImportedSillyTavernWorldInfo {
  name: string;
  description: string;
  tags: string[];
  scanDepth: number;
  tokenBudget: number;
  recursiveScan: boolean;
  entries: ImportedWorldbookEntry[];
  sourceSnapshot: unknown;
}

export type ImportedWorldbookEntry = Omit<
  WorldbookEntry,
  "id" | "worldbookId" | "createdAtMs" | "updatedAtMs"
>;

export interface SillyTavernWorldInfoOutput {
  name: string;
  entries: Record<string, SillyTavernWorldInfoEntryOutput>;
}

export interface SillyTavernWorldInfoEntryOutput {
  uid: number | null;
  addMemo: boolean;
  automationId: string;
  characterFilter: WorldbookCharacterFilter;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  disable: boolean;
  constant: boolean;
  selective: boolean;
  selectiveLogic: number;
  vectorized: boolean;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  position: number | string;
  order: number;
  displayIndex: number;
  role: number;
  depth: number;
  useProbability: boolean;
  probability: number;
  scanDepth: number | null;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: boolean | number;
  ignoreBudget: boolean;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  useGroupScoring: boolean | null;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  matchCharacterDepthPrompt: boolean;
  outletName: string;
  triggers: WorldbookGenerationTrigger[];
}

export function fromSillyTavernWorldInfo(
  input: unknown,
  fileName: string,
): ImportedSillyTavernWorldInfo {
  if (!isRecord(input)) {
    throw new WorldbookApplicationError("invalid-worldbook");
  }

  const entries = entriesArray(input).map(toImportedEntry);

  return {
    name: stringField(input, "name") || worldbookNameFromFileName(fileName),
    description: stringField(input, "description"),
    tags: stringArrayField(input, "tags"),
    scanDepth: optionalNumberField(input, "scanDepth") ?? 3,
    tokenBudget: optionalNumberField(input, "tokenBudget") ?? 1024,
    recursiveScan: optionalBooleanField(input, "recursiveScan") ?? false,
    entries,
    sourceSnapshot: input,
  };
}

export function toSillyTavernWorldInfo(
  worldbook: Worldbook,
): SillyTavernWorldInfoOutput {
  const entries = [...worldbook.entries].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );

  return {
    name: worldbook.name,
    entries: Object.fromEntries(
      entries.map((entry, index) => [
        String(index),
        {
          uid: entry.externalUid,
          addMemo: entry.addMemo,
          automationId: entry.automationId,
          characterFilter: entry.characterFilter,
          key: entry.primaryKeys,
          keysecondary: entry.secondaryKeys,
          comment: entry.comment || entry.name,
          content: entry.content,
          disable: !entry.enabled,
          constant: entry.constant,
          selective: entry.selective,
          selectiveLogic: sillyTavernConditionLogic(entry.conditionLogic),
          vectorized: entry.vectorized,
          caseSensitive: sillyTavernTriState(entry.caseSensitive),
          matchWholeWords: sillyTavernTriState(entry.matchWholeWords),
          position: sillyTavernPosition(entry.insertionPosition),
          order: entry.insertionOrder,
          displayIndex: entry.displayOrder,
          role: sillyTavernDepthRole(entry.depthRole),
          depth: entry.insertionDepth,
          useProbability: entry.useProbability,
          probability: entry.probability,
          scanDepth: entry.scanDepth,
          excludeRecursion: !entry.recursiveScan,
          preventRecursion: entry.preventFurtherRecursion,
          delayUntilRecursion:
            entry.recursionDelayLevel ?? entry.delayUntilRecursion,
          ignoreBudget: entry.ignoreBudget,
          group: entry.group,
          groupOverride: entry.groupOverride,
          groupWeight: entry.groupWeight,
          useGroupScoring: sillyTavernTriState(entry.useGroupScoring),
          sticky: entry.sticky,
          cooldown: entry.cooldown,
          delay: entry.delay,
          matchPersonaDescription: entry.matchPersonaDescription,
          matchCharacterDescription: entry.matchCharacterDescription,
          matchCharacterPersonality: entry.matchCharacterPersonality,
          matchScenario: entry.matchScenario,
          matchCreatorNotes: entry.matchCreatorNotes,
          matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt,
          outletName: entry.outletName,
          triggers: entry.generationTriggers,
        },
      ]),
    ),
  };
}

function toImportedEntry(
  entry: Record<string, unknown>,
  index: number,
): ImportedWorldbookEntry {
  const content = stringField(entry, "content");
  const name =
    stringField(entry, "name") ||
    stringField(entry, "comment") ||
    `Entry ${index + 1}`;
  const recursionDelay = delayUntilRecursionField(entry);

  return {
    externalUid: nullableNumberField(entry, "uid"),
    enabled: !(optionalBooleanField(entry, "disable") ?? false),
    name,
    addMemo: optionalBooleanField(entry, "addMemo") ?? true,
    comment: stringField(entry, "comment"),
    content,
    primaryKeys: keysField(entry, ["key", "keys"]),
    secondaryKeys: keysField(entry, ["keysecondary", "secondaryKeys"]),
    conditionLogic: worldbookConditionLogic(entry.selectiveLogic),
    selective: optionalBooleanField(entry, "selective") ?? false,
    constant: optionalBooleanField(entry, "constant") ?? false,
    vectorized: optionalBooleanField(entry, "vectorized") ?? false,
    caseSensitive: triStateField(entry, "caseSensitive"),
    matchWholeWords: triStateField(entry, "matchWholeWords"),
    insertionPosition: worldbookInsertionPosition(entry.position),
    depthRole: worldbookDepthRole(entry.role),
    insertionDepth:
      optionalNumberField(entry, "depth") ??
      optionalNumberField(entry, "scanDepth") ??
      3,
    insertionOrder:
      optionalNumberField(entry, "order") ??
      optionalNumberField(entry, "displayIndex") ??
      index,
    displayOrder: optionalNumberField(entry, "displayIndex") ?? index,
    useProbability: optionalBooleanField(entry, "useProbability") ?? true,
    probability: optionalNumberField(entry, "probability") ?? 100,
    scanDepth: nullableNumberField(entry, "scanDepth"),
    recursiveScan: !(optionalBooleanField(entry, "excludeRecursion") ?? false),
    preventFurtherRecursion:
      optionalBooleanField(entry, "preventRecursion") ?? false,
    delayUntilRecursion: recursionDelay.enabled,
    recursionDelayLevel: recursionDelay.level,
    ignoreBudget: optionalBooleanField(entry, "ignoreBudget") ?? false,
    group: stringField(entry, "group"),
    groupOverride: optionalBooleanField(entry, "groupOverride") ?? false,
    groupWeight: optionalNumberField(entry, "groupWeight") ?? 100,
    useGroupScoring: triStateField(entry, "useGroupScoring"),
    sticky: nullableNumberField(entry, "sticky") ?? 0,
    cooldown: nullableNumberField(entry, "cooldown") ?? 0,
    delay: nullableNumberField(entry, "delay") ?? 0,
    matchPersonaDescription:
      optionalBooleanField(entry, "matchPersonaDescription") ?? false,
    matchCharacterDescription:
      optionalBooleanField(entry, "matchCharacterDescription") ?? false,
    matchCharacterPersonality:
      optionalBooleanField(entry, "matchCharacterPersonality") ?? false,
    matchScenario: optionalBooleanField(entry, "matchScenario") ?? false,
    matchCreatorNotes:
      optionalBooleanField(entry, "matchCreatorNotes") ?? false,
    matchCharacterDepthPrompt:
      optionalBooleanField(entry, "matchCharacterDepthPrompt") ?? false,
    automationId: stringField(entry, "automationId"),
    generationTriggers: generationTriggersField(entry, "triggers"),
    outletName: stringField(entry, "outletName"),
    characterFilter: characterFilterField(entry, "characterFilter"),
    tokenCount: countPromptTokens(content),
  };
}

function entriesArray(
  input: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const entries = input.entries;

  if (Array.isArray(entries) && entries.every(isRecord)) {
    return entries;
  }

  if (isRecord(entries)) {
    const entryValues = Object.values(entries);

    if (!entryValues.every(isRecord)) {
      throw new WorldbookApplicationError("invalid-worldbook");
    }

    return entryValues;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function keysField(input: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = input[key];

    if (value === undefined || value === null) {
      continue;
    }

    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
    ) {
      return value;
    }

    throw new WorldbookApplicationError("invalid-worldbook");
  }

  return [];
}

function worldbookInsertionPosition(
  value: unknown,
): WorldbookInsertionPosition {
  if (
    value === "beforeCharacterDefinition" ||
    value === "afterCharacterDefinition" ||
    value === "beforeAuthorNote" ||
    value === "afterAuthorNote" ||
    value === "atDepth" ||
    value === "beforeExampleMessages" ||
    value === "afterExampleMessages" ||
    value === "outlet" ||
    value === "unknown"
  ) {
    return value;
  }

  if (value === "beforeChar") {
    return "beforeCharacterDefinition";
  }

  if (value === "afterChar") {
    return "afterCharacterDefinition";
  }

  if (value === "beforeHistory") {
    return "beforeAuthorNote";
  }

  if (value === "afterHistory") {
    return "afterAuthorNote";
  }

  if (value === undefined || value === null || value === 0) {
    return "beforeCharacterDefinition";
  }

  if (value === 1) {
    return "afterCharacterDefinition";
  }

  if (value === 2) {
    return "beforeAuthorNote";
  }

  if (value === 3) {
    return "afterAuthorNote";
  }

  if (value === 4) {
    return "atDepth";
  }

  if (value === 5) {
    return "beforeExampleMessages";
  }

  if (value === 6) {
    return "afterExampleMessages";
  }

  if (value === 7) {
    return "outlet";
  }

  return "unknown";
}

function sillyTavernPosition(
  position: WorldbookInsertionPosition,
): number | string {
  const positions: Record<WorldbookInsertionPosition, number | string> = {
    beforeCharacterDefinition: 0,
    afterCharacterDefinition: 1,
    beforeAuthorNote: 2,
    afterAuthorNote: 3,
    atDepth: 4,
    beforeExampleMessages: 5,
    afterExampleMessages: 6,
    outlet: 7,
    unknown: "unknown",
  };

  return positions[position];
}

function worldbookDepthRole(value: unknown): WorldbookDepthRole {
  if (
    value === "system" ||
    value === undefined ||
    value === null ||
    value === 0
  ) {
    return "system";
  }

  if (value === "user" || value === 1) {
    return "user";
  }

  if (value === "assistant" || value === 2) {
    return "assistant";
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function sillyTavernDepthRole(role: WorldbookDepthRole): number {
  const roles: Record<WorldbookDepthRole, number> = {
    system: 0,
    user: 1,
    assistant: 2,
  };

  return roles[role];
}

function worldbookConditionLogic(value: unknown): WorldbookConditionLogic {
  if (
    value === "andAny" ||
    value === undefined ||
    value === null ||
    value === 0
  ) {
    return "andAny";
  }

  if (value === "notAll" || value === 1) {
    return "notAll";
  }

  if (value === "notAny" || value === 2) {
    return "notAny";
  }

  if (value === "andAll" || value === 3) {
    return "andAll";
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function sillyTavernConditionLogic(logic: WorldbookConditionLogic): number {
  const logics: Record<WorldbookConditionLogic, number> = {
    andAny: 0,
    notAll: 1,
    notAny: 2,
    andAll: 3,
  };

  return logics[logic];
}

function triStateField(
  input: Record<string, unknown>,
  key: string,
): WorldbookTriState {
  const value = input[key];

  if (value === undefined || value === null) {
    return "inherit";
  }

  if (value === true || value === "enabled") {
    return "enabled";
  }

  if (value === false || value === "disabled") {
    return "disabled";
  }

  if (value === "inherit") {
    return "inherit";
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function sillyTavernTriState(value: WorldbookTriState): boolean | null {
  if (value === "enabled") {
    return true;
  }

  if (value === "disabled") {
    return false;
  }

  return null;
}

function delayUntilRecursionField(input: Record<string, unknown>): {
  enabled: boolean;
  level: number | null;
} {
  const value = input.delayUntilRecursion;

  if (value === undefined || value === null) {
    return { enabled: false, level: null };
  }

  if (typeof value === "boolean") {
    return { enabled: value, level: null };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { enabled: true, level: value };
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function generationTriggersField(
  input: Record<string, unknown>,
  key: string,
): WorldbookGenerationTrigger[] {
  const value = input[key];

  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new WorldbookApplicationError("invalid-worldbook");
  }

  const allowed = new Set<WorldbookGenerationTrigger>([
    "normal",
    "continue",
    "impersonate",
    "swipe",
    "regenerate",
    "quiet",
  ]);

  if (
    value.every(
      (item): item is WorldbookGenerationTrigger =>
        typeof item === "string" &&
        allowed.has(item as WorldbookGenerationTrigger),
    )
  ) {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function characterFilterField(
  input: Record<string, unknown>,
  key: string,
): WorldbookCharacterFilter {
  const value = input[key];

  if (value === undefined || value === null) {
    return { isExclude: false, names: [], tags: [] };
  }

  if (!isRecord(value)) {
    throw new WorldbookApplicationError("invalid-worldbook");
  }

  return {
    isExclude: optionalBooleanField(value, "isExclude") ?? false,
    names: stringArrayField(value, "names"),
    tags: stringArrayField(value, "tags"),
  };
}

function stringField(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function stringArrayField(
  input: Record<string, unknown>,
  key: string,
): string[] {
  const value = input[key];

  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function optionalBooleanField(
  input: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = input[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function optionalNumberField(
  input: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = input[key];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function nullableNumberField(
  input: Record<string, unknown>,
  key: string,
): number | null {
  const value = input[key];

  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function worldbookNameFromFileName(fileName: string): string {
  const lastSegment = fileName.split(/[\\/]/).at(-1) ?? "";
  const extensionIndex = lastSegment.lastIndexOf(".");

  if (extensionIndex > 0) {
    return lastSegment.slice(0, extensionIndex) || "Untitled worldbook";
  }

  return lastSegment || "Untitled worldbook";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
