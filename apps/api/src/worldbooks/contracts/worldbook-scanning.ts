import type {
  WorldbookEntryRole,
  WorldbookGenerationTrigger,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
} from '../domain/worldbook.js';
import type { WorldbookScanSettings } from '../domain/worldbook-scan-preferences.js';

export type WorldbookSourceType = 'standalone' | 'characterCard';
export type WorldbookSourceRole = 'independent' | 'character' | 'persona';

export interface WorldbookEntryRef {
  sourceType: WorldbookSourceType;
  sourceAssetId: string;
  entryId: string;
}

export interface WorldbookScanEntry {
  id: string;
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
}

export interface WorldbookScanSource {
  sourceType: WorldbookSourceType;
  sourceAssetId: string;
  sourceRole: WorldbookSourceRole;
  name: string;
  entries: WorldbookScanEntry[];
}

export interface WorldbookScanHistoryMessage {
  name: string;
  content: string;
}

export interface WorldbookScanCharacterContext {
  fileName: string;
  tags: string[];
  description: string;
  personality: string;
  depthPrompt: string;
  scenario: string;
  creatorNotes: string;
}

export interface WorldbookScanRandom {
  next(): number;
}

export interface WorldbookTimedEffect {
  startMessageCount: number;
  endMessageCount: number;
  protected: boolean;
}

export interface WorldbookEntryRuntimeState {
  ref: WorldbookEntryRef;
  fingerprint: string;
  sticky?: WorldbookTimedEffect;
  cooldown?: WorldbookTimedEffect;
}

export interface WorldbookRuntimeState {
  entries: WorldbookEntryRuntimeState[];
}

export interface WorldbookScanContext {
  sources: WorldbookScanSource[];
  history: WorldbookScanHistoryMessage[];
  historyMessageCount: number;
  maxContextTokens: number;
  settings: WorldbookScanSettings;
  runtimeState: WorldbookRuntimeState;
  random: WorldbookScanRandom;
  generationTrigger: WorldbookGenerationTrigger;
  personaDescription: string;
  character: WorldbookScanCharacterContext;
}

export type WorldbookScanState = 'initial' | 'recursion' | 'minActivations';

export interface WorldbookActivatedEntry {
  ref: WorldbookEntryRef;
  sourceName: string;
  name: string;
  content: string;
  insertionPosition: WorldbookInsertionPosition;
  insertionOrder: number;
  depth: number;
  insertionRole: WorldbookEntryRole;
  anchorName: string;
}

export interface WorldbookDepthInsertion {
  depth: number;
  role: WorldbookEntryRole;
  entries: WorldbookActivatedEntry[];
}

export interface WorldbookScanInsertions {
  beforeCharacterDefinition: WorldbookActivatedEntry[];
  afterCharacterDefinition: WorldbookActivatedEntry[];
  beforeAuthorsNote: WorldbookActivatedEntry[];
  afterAuthorsNote: WorldbookActivatedEntry[];
  beforeExampleMessages: WorldbookActivatedEntry[];
  afterExampleMessages: WorldbookActivatedEntry[];
  atDepth: WorldbookDepthInsertion[];
  anchors: Record<string, WorldbookActivatedEntry[]>;
}

export interface WorldbookEntryTrace {
  iteration: number;
  state: WorldbookScanState;
  ref: WorldbookEntryRef;
  outcome: 'activated' | 'skipped' | 'rejected';
  reason: string;
  matchedPrimaryKey?: string;
  matchedSecondaryKeys?: string[];
}

export interface WorldbookRandomTrace {
  purpose: 'probability' | 'group';
  value: number;
  threshold: number;
  ref?: WorldbookEntryRef;
  group?: string;
  acceptedRef?: WorldbookEntryRef;
}

export interface WorldbookScanTrace {
  iterations: Array<{
    iteration: number;
    state: WorldbookScanState;
    nextState: WorldbookScanState | null;
    activatedRefs: WorldbookEntryRef[];
  }>;
  entries: WorldbookEntryTrace[];
  randomSamples: WorldbookRandomTrace[];
  budget: {
    limit: number;
    used: number;
    overflowed: boolean;
  };
}

export interface WorldbookScanResult {
  activatedEntries: WorldbookActivatedEntry[];
  insertions: WorldbookScanInsertions;
  nextRuntimeState: WorldbookRuntimeState;
  trace: WorldbookScanTrace;
}

export function uniqueWorldbookScanSources(sources: WorldbookScanSource[]): WorldbookScanSource[] {
  const byAsset = new Map<string, WorldbookScanSource>();

  for (const source of sources) {
    const key = `${source.sourceType}:${source.sourceAssetId}`;
    const existing = byAsset.get(key);

    if (!existing || (existing.sourceRole === 'persona' && source.sourceRole === 'character')) {
      byAsset.set(key, source);
    }
  }

  return [...byAsset.values()];
}
