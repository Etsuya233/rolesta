export const WORLDBOOK_VISIBILITIES = ['private', 'public'] as const;
export type WorldbookVisibility = (typeof WORLDBOOK_VISIBILITIES)[number];

export const WORLDBOOK_SOURCE_FORMATS = ['sillytavern_world_info', 'rolesta'] as const;
export type WorldbookSourceFormat = (typeof WORLDBOOK_SOURCE_FORMATS)[number];

export const WORLDBOOK_INSERTION_POSITIONS = [
  'beforeCharacterDefinition',
  'afterCharacterDefinition',
  'beforeAuthorsNote',
  'afterAuthorsNote',
  'atDepth',
  'beforeExampleMessages',
  'afterExampleMessages',
  'atAnchor',
  'unknown',
] as const;
export type WorldbookInsertionPosition = (typeof WORLDBOOK_INSERTION_POSITIONS)[number];

export const WORLDBOOK_ENTRY_ROLES = ['system', 'user', 'assistant'] as const;
export type WorldbookEntryRole = (typeof WORLDBOOK_ENTRY_ROLES)[number];

export const WORLDBOOK_SELECTIVE_LOGICS = ['andAny', 'notAll', 'notAny', 'andAll'] as const;
export type WorldbookSelectiveLogic = (typeof WORLDBOOK_SELECTIVE_LOGICS)[number];

export const WORLDBOOK_GENERATION_TRIGGERS = [
  'normal',
  'continue',
  'impersonate',
  'swipe',
  'regenerate',
  'quiet',
] as const;
export type WorldbookGenerationTrigger = (typeof WORLDBOOK_GENERATION_TRIGGERS)[number];

export interface Worldbook {
  id: string;
  ownerUserId: string;
  visibility: WorldbookVisibility;
  name: string;
  description: string;
  tags: string[];
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
  selectiveLogic: WorldbookSelectiveLogic;
  constant: boolean;
  vectorized: boolean;
  ignoreBudget: boolean;
  useProbability: boolean;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchCharacterDepthPrompt: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  insertionPosition: WorldbookInsertionPosition;
  insertionOrder: number;
  displayIndex: number;
  depth: number;
  insertionRole: WorldbookEntryRole;
  anchorName: string;
  scanDepth: number | null;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: number;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  useGroupScoring: boolean | null;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  characterFilterNames: string[];
  characterFilterTags: string[];
  characterFilterExclude: boolean;
  triggers: WorldbookGenerationTrigger[];
  automationId: string;
  addMemo: boolean;
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
    entryCount: worldbook.entries.length,
    enabledEntryCount: worldbook.entries.filter((entry) => entry.enabled).length,
    tokenCount: worldbook.entries.reduce((total, entry) => total + entry.tokenCount, 0),
    createdAtMs: worldbook.createdAtMs,
    updatedAtMs: worldbook.updatedAtMs,
    lastUsedAtMs: worldbook.lastUsedAtMs,
    usageCount: worldbook.usageCount,
  };
}
