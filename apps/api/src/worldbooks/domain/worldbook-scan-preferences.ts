export const CHARACTER_LORE_INSERTION_STRATEGIES = [
  'evenly',
  'characterFirst',
  'globalFirst',
] as const;
export type CharacterLoreInsertionStrategy = (typeof CHARACTER_LORE_INSERTION_STRATEGIES)[number];

export interface WorldbookScanPreferences {
  scanDepth: number;
  minActivations: number;
  minActivationsDepthMax: number;
  budgetPercent: number;
  budgetCap: number;
  recursive: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  useGroupScoring: boolean;
  maxRecursionSteps: number;
  includeNames: boolean;
  characterLoreInsertionStrategy: CharacterLoreInsertionStrategy;
}

export type WorldbookScanSettings = Readonly<WorldbookScanPreferences>;

export const DEFAULT_WORLDBOOK_SCAN_PREFERENCES: Readonly<WorldbookScanPreferences> = Object.freeze(
  {
    scanDepth: 2,
    minActivations: 0,
    minActivationsDepthMax: 0,
    budgetPercent: 25,
    budgetCap: 0,
    recursive: false,
    caseSensitive: false,
    matchWholeWords: false,
    useGroupScoring: false,
    maxRecursionSteps: 0,
    includeNames: true,
    characterLoreInsertionStrategy: 'characterFirst',
  },
);

export function worldbookScanSettings(
  preferences: WorldbookScanPreferences,
): WorldbookScanSettings {
  return Object.freeze({ ...preferences });
}
