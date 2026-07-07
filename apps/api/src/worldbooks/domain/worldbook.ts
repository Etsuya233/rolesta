export const WORLDBOOK_VISIBILITIES = ["private", "public"] as const;
export type WorldbookVisibility = (typeof WORLDBOOK_VISIBILITIES)[number];

export const WORLDBOOK_SOURCE_FORMATS = [
  "sillytavern_world_info",
  "rolesta",
] as const;
export type WorldbookSourceFormat = (typeof WORLDBOOK_SOURCE_FORMATS)[number];

export const WORLDBOOK_INSERTION_POSITIONS = [
  "beforeCharacterDefinition",
  "afterCharacterDefinition",
  "beforeAuthorNote",
  "afterAuthorNote",
  "atDepth",
  "beforeExampleMessages",
  "afterExampleMessages",
  "outlet",
  "unknown",
] as const;
export type WorldbookInsertionPosition =
  (typeof WORLDBOOK_INSERTION_POSITIONS)[number];

export const WORLDBOOK_DEPTH_ROLES = ["system", "user", "assistant"] as const;
export type WorldbookDepthRole = (typeof WORLDBOOK_DEPTH_ROLES)[number];

export const WORLDBOOK_CONDITION_LOGICS = [
  "andAny",
  "notAll",
  "notAny",
  "andAll",
] as const;
export type WorldbookConditionLogic =
  (typeof WORLDBOOK_CONDITION_LOGICS)[number];

export const WORLDBOOK_TRI_STATES = ["inherit", "enabled", "disabled"] as const;
export type WorldbookTriState = (typeof WORLDBOOK_TRI_STATES)[number];

export const WORLDBOOK_GENERATION_TRIGGERS = [
  "normal",
  "continue",
  "impersonate",
  "swipe",
  "regenerate",
  "quiet",
] as const;
export type WorldbookGenerationTrigger =
  (typeof WORLDBOOK_GENERATION_TRIGGERS)[number];

export interface WorldbookCharacterFilter {
  isExclude: boolean;
  names: string[];
  tags: string[];
}

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
  externalUid: number | null;
  enabled: boolean;
  name: string;
  addMemo: boolean;
  comment: string;
  content: string;
  primaryKeys: string[];
  secondaryKeys: string[];
  conditionLogic: WorldbookConditionLogic;
  selective: boolean;
  constant: boolean;
  vectorized: boolean;
  caseSensitive: WorldbookTriState;
  matchWholeWords: WorldbookTriState;
  insertionPosition: WorldbookInsertionPosition;
  depthRole: WorldbookDepthRole;
  insertionDepth: number;
  insertionOrder: number;
  displayOrder: number;
  useProbability: boolean;
  probability: number;
  scanDepth: number | null;
  recursiveScan: boolean;
  preventFurtherRecursion: boolean;
  delayUntilRecursion: boolean;
  recursionDelayLevel: number | null;
  ignoreBudget: boolean;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  useGroupScoring: WorldbookTriState;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  matchCharacterDepthPrompt: boolean;
  automationId: string;
  generationTriggers: WorldbookGenerationTrigger[];
  outletName: string;
  characterFilter: WorldbookCharacterFilter;
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
