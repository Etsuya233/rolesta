export const WORLDBOOK_VISIBILITIES = ["private", "public"] as const;
export type WorldbookVisibility = (typeof WORLDBOOK_VISIBILITIES)[number];

export const WORLDBOOK_SOURCE_FORMATS = [
  "sillytavern_world_info",
  "rolesta",
] as const;
export type WorldbookSourceFormat = (typeof WORLDBOOK_SOURCE_FORMATS)[number];

export const WORLDBOOK_INSERTION_POSITIONS = [
  "beforeChar",
  "afterChar",
  "beforeHistory",
  "afterHistory",
  "unknown",
] as const;
export type WorldbookInsertionPosition =
  (typeof WORLDBOOK_INSERTION_POSITIONS)[number];

export interface Worldbook {
  id: string;
  ownerUserId: string;
  visibility: WorldbookVisibility;
  name: string;
  description: string;
  tags: string[];
  scanDepth: number;
  tokenBudget: number;
  recursiveScan: boolean;
  entries: WorldbookEntry[];
  sourceFormat: WorldbookSourceFormat;
  sourceSnapshot: unknown;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface WorldbookSummary {
  id: string;
  ownerUserId: string;
  visibility: WorldbookVisibility;
  name: string;
  description: string;
  tags: string[];
  scanDepth: number;
  tokenBudget: number;
  recursiveScan: boolean;
  entryCount: number;
  enabledEntryCount: number;
  tokenCount: number;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface WorldbookEntry {
  id: string;
  worldbookId: string;
  enabled: boolean;
  name: string;
  comment: string;
  content: string;
  primaryKeys: string[];
  secondaryKeys: string[];
  selective: boolean;
  constant: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  insertionPosition: WorldbookInsertionPosition;
  insertionOrder: number;
  depth: number;
  probability: number;
  tokenCount: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export function toWorldbookSummary(worldbook: Worldbook): WorldbookSummary {
  return {
    id: worldbook.id,
    ownerUserId: worldbook.ownerUserId,
    visibility: worldbook.visibility,
    name: worldbook.name,
    description: worldbook.description,
    tags: worldbook.tags,
    scanDepth: worldbook.scanDepth,
    tokenBudget: worldbook.tokenBudget,
    recursiveScan: worldbook.recursiveScan,
    entryCount: worldbook.entries.length,
    enabledEntryCount: worldbook.entries.filter((entry) => entry.enabled)
      .length,
    tokenCount: worldbook.entries.reduce(
      (total, entry) => total + entry.tokenCount,
      0,
    ),
    createdAtMs: worldbook.createdAtMs,
    updatedAtMs: worldbook.updatedAtMs,
    lastUsedAtMs: worldbook.lastUsedAtMs,
    usageCount: worldbook.usageCount,
  };
}
