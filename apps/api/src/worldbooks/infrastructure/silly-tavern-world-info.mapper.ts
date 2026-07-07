import { countPromptTokens } from "@rolesta/shared";
import { WorldbookApplicationError } from "../application/worldbook-application-error.js";
import type {
  Worldbook,
  WorldbookEntry,
  WorldbookInsertionPosition,
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
  selective: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  position: number | string;
  order: number;
  depth: number;
  probability: number;
  scanDepth: number;
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
          selective: entry.selective,
          caseSensitive: entry.caseSensitive,
          matchWholeWords: entry.matchWholeWords,
          position: sillyTavernPosition(entry.insertionPosition),
          order: entry.insertionOrder,
          depth: entry.depth,
          probability: entry.probability,
          scanDepth: worldbook.scanDepth,
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
    constant: optionalBooleanField(entry, "constant") ?? false,
    caseSensitive: optionalBooleanField(entry, "caseSensitive") ?? false,
    matchWholeWords: optionalBooleanField(entry, "matchWholeWords") ?? false,
    insertionPosition: worldbookInsertionPosition(entry.position),
    insertionOrder:
      optionalNumberField(entry, "displayIndex") ??
      optionalNumberField(entry, "order") ??
      index,
    depth:
      optionalNumberField(entry, "depth") ??
      optionalNumberField(entry, "scanDepth") ??
      3,
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
    value === "beforeChar" ||
    value === "afterChar" ||
    value === "beforeHistory" ||
    value === "afterHistory" ||
    value === "unknown"
  ) {
    return value;
  }

  if (value === undefined || value === null || value === 0) {
    return "beforeChar";
  }

  if (value === 1) {
    return "afterChar";
  }

  if (value === 2) {
    return "beforeHistory";
  }

  if (value === 3) {
    return "afterHistory";
  }

  return "unknown";
}

function sillyTavernPosition(
  position: WorldbookInsertionPosition,
): number | string {
  const positions: Record<WorldbookInsertionPosition, number | string> = {
    beforeChar: 0,
    afterChar: 1,
    beforeHistory: 2,
    afterHistory: 3,
    unknown: "unknown",
  };

  return positions[position];
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
