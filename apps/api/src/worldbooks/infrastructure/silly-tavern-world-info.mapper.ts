import { countPromptTokens } from "@rolesta/shared";
import { WorldbookApplicationError } from "../application/worldbook-application-error.js";
import type {
  Worldbook,
  WorldbookEntryRole,
  WorldbookEntry,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
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
  uid: number;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  disable: boolean;
  constant: boolean;
  vectorized: boolean;
  selective: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  position: number | string;
  role: number;
  selectiveLogic: number;
  order: number;
  depth: number;
  probability: number;
  scanDepth: number;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: boolean;
  outletName: string;
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
    (left, right) => left.insertionOrder - right.insertionOrder,
  );

  return {
    name: worldbook.name,
    entries: Object.fromEntries(
      entries.map((entry, index) => [
        String(index),
        {
          uid: index,
          key: entry.primaryKeys,
          keysecondary: entry.secondaryKeys,
          comment: entry.comment || entry.name,
          content: entry.content,
          disable: !entry.enabled,
          constant: entry.constant,
          vectorized: entry.vectorized,
          selective: entry.selective,
          selectiveLogic: sillyTavernSelectiveLogic(entry.selectiveLogic),
          caseSensitive: entry.caseSensitive,
          matchWholeWords: entry.matchWholeWords,
          position: sillyTavernPosition(entry.insertionPosition),
          role: sillyTavernRole(entry.insertionRole),
          order: entry.insertionOrder,
          depth: entry.depth,
          probability: entry.probability,
          scanDepth: entry.scanDepth ?? worldbook.scanDepth,
          excludeRecursion: entry.excludeRecursion,
          preventRecursion: entry.preventRecursion,
          delayUntilRecursion: entry.delayUntilRecursion,
          outletName: entry.anchorName,
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

  return {
    enabled: !(optionalBooleanField(entry, "disable") ?? false),
    name,
    comment: stringField(entry, "comment"),
    content,
    primaryKeys: keysField(entry, ["key", "keys"]),
    secondaryKeys: keysField(entry, ["keysecondary", "secondaryKeys"]),
    selective: optionalBooleanField(entry, "selective") ?? false,
    selectiveLogic: worldbookSelectiveLogic(
      compatibleField(entry, "selectiveLogic", "selectiveLogic"),
    ),
    constant: optionalBooleanField(entry, "constant") ?? false,
    vectorized:
      optionalBooleanCompatibleField(entry, "vectorized", "vectorized") ??
      false,
    caseSensitive: optionalBooleanField(entry, "caseSensitive") ?? false,
    matchWholeWords: optionalBooleanField(entry, "matchWholeWords") ?? false,
    insertionPosition: worldbookInsertionPosition(
      compatibleField(entry, "position", "position"),
    ),
    insertionOrder:
      optionalNumberField(entry, "displayIndex") ??
      optionalNumberField(entry, "order") ??
      index,
    depth:
      optionalNumberField(entry, "depth") ??
      optionalNumberField(entry, "scanDepth") ??
      3,
    insertionRole: worldbookEntryRole(compatibleField(entry, "role", "role")),
    anchorName: stringCompatibleField(entry, "outletName", "outlet_name"),
    scanDepth:
      optionalNumberCompatibleField(entry, "scanDepth", "scan_depth") ?? null,
    excludeRecursion:
      optionalBooleanCompatibleField(
        entry,
        "excludeRecursion",
        "exclude_recursion",
      ) ?? false,
    preventRecursion:
      optionalBooleanCompatibleField(
        entry,
        "preventRecursion",
        "prevent_recursion",
      ) ?? false,
    delayUntilRecursion:
      optionalBooleanCompatibleField(
        entry,
        "delayUntilRecursion",
        "delay_until_recursion",
      ) ?? false,
    probability: optionalNumberField(entry, "probability") ?? 100,
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
    value === "beforeAuthorsNote" ||
    value === "afterAuthorsNote" ||
    value === "atDepth" ||
    value === "beforeExampleMessages" ||
    value === "afterExampleMessages" ||
    value === "atAnchor" ||
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
    return "beforeAuthorsNote";
  }

  if (value === "afterHistory") {
    return "afterAuthorsNote";
  }

  if (value === undefined || value === null || value === 0) {
    return "beforeCharacterDefinition";
  }

  if (value === 1) {
    return "afterCharacterDefinition";
  }

  if (value === 2) {
    return "beforeAuthorsNote";
  }

  if (value === 3) {
    return "afterAuthorsNote";
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
    return "atAnchor";
  }

  return "unknown";
}

function worldbookEntryRole(value: unknown): WorldbookEntryRole {
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

function worldbookSelectiveLogic(value: unknown): WorldbookSelectiveLogic {
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

function sillyTavernPosition(
  position: WorldbookInsertionPosition,
): number | string {
  const positions: Record<WorldbookInsertionPosition, number | string> = {
    beforeCharacterDefinition: 0,
    afterCharacterDefinition: 1,
    beforeAuthorsNote: 2,
    afterAuthorsNote: 3,
    atDepth: 4,
    beforeExampleMessages: 5,
    afterExampleMessages: 6,
    atAnchor: 7,
    unknown: "unknown",
  };

  return positions[position];
}

function sillyTavernRole(role: WorldbookEntryRole): number {
  const roles: Record<WorldbookEntryRole, number> = {
    system: 0,
    user: 1,
    assistant: 2,
  };

  return roles[role];
}

function sillyTavernSelectiveLogic(logic: WorldbookSelectiveLogic): number {
  const logics: Record<WorldbookSelectiveLogic, number> = {
    andAny: 0,
    notAll: 1,
    notAny: 2,
    andAll: 3,
  };

  return logics[logic];
}

function compatibleField(
  input: Record<string, unknown>,
  directKey: string,
  extensionKey: string,
): unknown {
  const value = input[directKey];

  if (value !== undefined && value !== null) {
    return value;
  }

  const extensions = input.extensions;

  if (!isRecord(extensions)) {
    return undefined;
  }

  return extensions[extensionKey];
}

function stringCompatibleField(
  input: Record<string, unknown>,
  directKey: string,
  extensionKey: string,
): string {
  const value = compatibleField(input, directKey, extensionKey);

  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function optionalBooleanCompatibleField(
  input: Record<string, unknown>,
  directKey: string,
  extensionKey: string,
): boolean | undefined {
  const value = compatibleField(input, directKey, extensionKey);

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
}

function optionalNumberCompatibleField(
  input: Record<string, unknown>,
  directKey: string,
  extensionKey: string,
): number | undefined {
  const value = compatibleField(input, directKey, extensionKey);

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new WorldbookApplicationError("invalid-worldbook");
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
