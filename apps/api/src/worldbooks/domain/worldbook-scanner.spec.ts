import { describe, expect, it } from 'vitest';
import type {
  WorldbookRuntimeState,
  WorldbookScanContext,
  WorldbookScanEntry,
  WorldbookScanSource,
} from '../contracts/worldbook-scanning.js';
import { DEFAULT_WORLDBOOK_SCAN_PREFERENCES } from './worldbook-scan-preferences.js';
import { WorldbookScanner } from './worldbook-scanner.js';

describe('WorldbookScanner', () => {
  it('handles activation and insertion cases', () => {
    const scanner = new WorldbookScanner();
    const result = scanner.scan(
      scanContext({
        history: [
          { name: 'User', content: 'The silver gate leads to Eldoria.' },
          { name: 'Seraphina', content: 'The forest is quiet.' },
        ],
        sources: [
          source([
            entry({
              id: 'primary',
              primaryKeys: ['silver gate'],
              content: 'Gate lore',
              insertionPosition: 'beforeCharacterDefinition',
              insertionOrder: 100,
            }),
            entry({
              id: 'and-all',
              primaryKeys: ['eldoria'],
              secondaryKeys: ['silver', 'gate'],
              selective: true,
              selectiveLogic: 'andAll',
              content: 'Eldoria lore',
              insertionPosition: 'afterCharacterDefinition',
              insertionOrder: 50,
            }),
            entry({
              id: 'not-any-loser',
              primaryKeys: ['eldoria'],
              secondaryKeys: ['forest'],
              selective: true,
              selectiveLogic: 'notAny',
              content: 'Wrong lore',
            }),
            entry({
              id: 'decorated',
              content: '@@activate\nAlways active',
              insertionPosition: 'atDepth',
              depth: 2,
              insertionRole: 'assistant',
            }),
            entry({ id: 'blocked', content: '@@dont_activate\nNever active', constant: true }),
          ]),
        ],
      }),
    );

    expect(result.activatedEntries.map((item) => item.ref.entryId)).toEqual([
      'decorated',
      'and-all',
      'primary',
    ]);
    expect(result.insertions.beforeCharacterDefinition.map((item) => item.content)).toEqual([
      'Gate lore',
    ]);
    expect(result.insertions.afterCharacterDefinition.map((item) => item.content)).toEqual([
      'Eldoria lore',
    ]);
    expect(result.insertions.atDepth).toMatchObject([
      { depth: 2, role: 'assistant', entries: [{ content: 'Always active' }] },
    ]);
  });

  it('handles recursion, probability, inclusion group, and budget behavior', () => {
    const random = sequenceRandom([0.8, 0.75]);
    const result = new WorldbookScanner().scan(
      scanContext({
        history: [{ name: 'User', content: 'alpha' }],
        random,
        maxContextTokens: 100,
        settings: {
          ...DEFAULT_WORLDBOOK_SCAN_PREFERENCES,
          recursive: true,
          budgetPercent: 20,
        },
        sources: [
          source([
            entry({ id: 'seed', primaryKeys: ['alpha'], content: 'beta' }),
            entry({ id: 'recursive', primaryKeys: ['beta'], content: 'recursive lore' }),
            entry({
              id: 'probability-loser',
              constant: true,
              useProbability: true,
              probability: 20,
              content: 'probability lore',
            }),
            entry({ id: 'group-light', constant: true, group: 'weather', groupWeight: 25 }),
            entry({ id: 'group-heavy', constant: true, group: 'weather', groupWeight: 75 }),
          ]),
        ],
      }),
    );

    expect(result.activatedEntries.map((item) => item.ref.entryId)).toEqual(
      expect.arrayContaining(['seed', 'recursive', 'group-heavy']),
    );
    expect(result.activatedEntries.map((item) => item.ref.entryId)).not.toContain(
      'probability-loser',
    );
    expect(result.activatedEntries.map((item) => item.ref.entryId)).not.toContain('group-light');
    expect(result.trace.randomSamples).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ purpose: 'group', group: 'weather' }),
        expect.objectContaining({ purpose: 'probability', threshold: 20 }),
      ]),
    );
    expect(result.trace.iterations.length).toBeGreaterThan(1);
  });

  it('uses inherited matching settings and optional character context sources', () => {
    const result = new WorldbookScanner().scan(
      scanContext({
        history: [{ name: 'User', content: 'ELDORIA' }],
        personaDescription: 'A silver-haired traveler',
        character: {
          ...emptyCharacter,
          fileName: 'seraphina.png',
          tags: ['guardian'],
          creatorNotes: 'The hidden archive',
        },
        settings: {
          ...DEFAULT_WORLDBOOK_SCAN_PREFERENCES,
          caseSensitive: true,
        },
        sources: [
          source([
            entry({ id: 'case-inherits', primaryKeys: ['eldoria'] }),
            entry({ id: 'case-overrides', primaryKeys: ['eldoria'], caseSensitive: false }),
            entry({
              id: 'creator-notes',
              primaryKeys: ['archive'],
              matchCreatorNotes: true,
            }),
            entry({
              id: 'character-filter',
              constant: true,
              characterFilterNames: ['seraphina.png'],
              characterFilterTags: ['guardian'],
            }),
          ]),
        ],
      }),
    );

    expect(result.activatedEntries.map((item) => item.ref.entryId)).toEqual(
      expect.arrayContaining(['case-overrides', 'creator-notes', 'character-filter']),
    );
    expect(result.activatedEntries.map((item) => item.ref.entryId)).not.toContain('case-inherits');
  });

  it('returns immutable candidate runtime state and advances sticky/cooldown by history count', () => {
    const scanner = new WorldbookScanner();
    const stickyEntry = entry({
      id: 'timed',
      primaryKeys: ['alpha'],
      sticky: 2,
      cooldown: 3,
      content: 'timed lore',
    });
    const originalState: WorldbookRuntimeState = { entries: [] };
    const first = scanner.scan(
      scanContext({
        historyMessageCount: 10,
        history: [{ name: 'User', content: 'alpha' }],
        runtimeState: originalState,
        sources: [source([stickyEntry])],
      }),
    );

    expect(originalState).toEqual({ entries: [] });
    expect(first.nextRuntimeState.entries[0]).toMatchObject({
      sticky: { startMessageCount: 10, endMessageCount: 12, protected: false },
      cooldown: { startMessageCount: 10, endMessageCount: 13, protected: false },
    });

    const duringSticky = scanner.scan(
      scanContext({
        historyMessageCount: 11,
        runtimeState: first.nextRuntimeState,
        sources: [source([stickyEntry])],
      }),
    );
    expect(duringSticky.activatedEntries.map((item) => item.ref.entryId)).toEqual(['timed']);

    const afterSticky = scanner.scan(
      scanContext({
        historyMessageCount: 12,
        runtimeState: first.nextRuntimeState,
        sources: [source([stickyEntry])],
      }),
    );
    expect(afterSticky.activatedEntries).toEqual([]);
    expect(afterSticky.nextRuntimeState.entries[0]?.cooldown).toEqual({
      startMessageCount: 12,
      endMessageCount: 15,
      protected: true,
    });

    const edited = scanner.scan(
      scanContext({
        historyMessageCount: 12,
        runtimeState: afterSticky.nextRuntimeState,
        history: [{ name: 'User', content: 'alpha' }],
        sources: [source([{ ...stickyEntry, content: 'edited lore' }])],
      }),
    );
    expect(edited.activatedEntries.map((item) => item.ref.entryId)).toEqual(['timed']);
  });

  it('deduplicates the same embedded character book and keeps character role precedence', () => {
    const embedded = source([entry({ id: 'embedded', constant: true })], {
      sourceType: 'characterCard',
      sourceAssetId: 'same-card',
      sourceRole: 'persona',
    });
    const result = new WorldbookScanner().scan(
      scanContext({
        sources: [embedded, { ...embedded, sourceRole: 'character' }],
      }),
    );

    expect(result.activatedEntries).toHaveLength(1);
    expect(result.activatedEntries[0]?.ref).toEqual({
      sourceType: 'characterCard',
      sourceAssetId: 'same-card',
      entryId: 'embedded',
    });
  });

  it('keeps SillyTavern outlet order and records group losers as rejected', () => {
    const result = new WorldbookScanner().scan(
      scanContext({
        random: sequenceRandom([0]),
        sources: [
          source([
            entry({
              id: 'lower-priority',
              constant: true,
              insertionPosition: 'atAnchor',
              anchorName: 'lore',
              insertionOrder: 50,
              content: 'Lower priority',
            }),
            entry({
              id: 'higher-priority',
              constant: true,
              insertionPosition: 'atAnchor',
              anchorName: 'lore',
              insertionOrder: 100,
              content: 'Higher priority',
            }),
            entry({ id: 'group-winner', constant: true, group: 'weather', groupWeight: 100 }),
            entry({ id: 'group-loser', constant: true, group: 'weather', groupWeight: 0 }),
          ]),
        ],
      }),
    );

    expect(result.insertions.anchors.lore?.map((item) => item.ref.entryId)).toEqual([
      'higher-priority',
      'lower-priority',
    ]);
    expect(result.trace.entries.filter((item) => item.ref.entryId === 'group-loser')).toEqual([
      expect.objectContaining({ outcome: 'rejected', reason: 'group' }),
    ]);
  });
});

function scanContext(overrides: Partial<WorldbookScanContext> = {}): WorldbookScanContext {
  return {
    sources: overrides.sources ?? [],
    history: overrides.history ?? [],
    historyMessageCount: overrides.historyMessageCount ?? overrides.history?.length ?? 0,
    maxContextTokens: overrides.maxContextTokens ?? 4096,
    settings: overrides.settings ?? { ...DEFAULT_WORLDBOOK_SCAN_PREFERENCES },
    runtimeState: overrides.runtimeState ?? { entries: [] },
    random: overrides.random ?? sequenceRandom([0]),
    generationTrigger: overrides.generationTrigger ?? 'normal',
    personaDescription: overrides.personaDescription ?? '',
    character: overrides.character ?? emptyCharacter,
  };
}

const emptyCharacter: WorldbookScanContext['character'] = {
  fileName: '',
  tags: [],
  description: '',
  personality: '',
  depthPrompt: '',
  scenario: '',
  creatorNotes: '',
};

function source(
  entries: WorldbookScanEntry[],
  overrides: Partial<WorldbookScanSource> = {},
): WorldbookScanSource {
  return {
    sourceType: overrides.sourceType ?? 'standalone',
    sourceAssetId: overrides.sourceAssetId ?? 'book',
    sourceRole: overrides.sourceRole ?? 'independent',
    name: overrides.name ?? 'Book',
    entries,
  };
}

function entry(overrides: Partial<WorldbookScanEntry> = {}): WorldbookScanEntry {
  return {
    id: overrides.id ?? 'entry',
    enabled: overrides.enabled ?? true,
    name: overrides.name ?? overrides.id ?? 'Entry',
    comment: overrides.comment ?? '',
    content: overrides.content ?? 'lore',
    primaryKeys: overrides.primaryKeys ?? [],
    secondaryKeys: overrides.secondaryKeys ?? [],
    selective: overrides.selective ?? false,
    selectiveLogic: overrides.selectiveLogic ?? 'andAny',
    constant: overrides.constant ?? false,
    vectorized: overrides.vectorized ?? false,
    ignoreBudget: overrides.ignoreBudget ?? false,
    useProbability: overrides.useProbability ?? true,
    caseSensitive: overrides.caseSensitive === undefined ? null : overrides.caseSensitive,
    matchWholeWords: overrides.matchWholeWords === undefined ? null : overrides.matchWholeWords,
    matchPersonaDescription: overrides.matchPersonaDescription ?? false,
    matchCharacterDescription: overrides.matchCharacterDescription ?? false,
    matchCharacterPersonality: overrides.matchCharacterPersonality ?? false,
    matchCharacterDepthPrompt: overrides.matchCharacterDepthPrompt ?? false,
    matchScenario: overrides.matchScenario ?? false,
    matchCreatorNotes: overrides.matchCreatorNotes ?? false,
    insertionPosition: overrides.insertionPosition ?? 'beforeCharacterDefinition',
    insertionOrder: overrides.insertionOrder ?? 0,
    depth: overrides.depth ?? 4,
    insertionRole: overrides.insertionRole ?? 'system',
    anchorName: overrides.anchorName ?? '',
    scanDepth: overrides.scanDepth === undefined ? null : overrides.scanDepth,
    excludeRecursion: overrides.excludeRecursion ?? false,
    preventRecursion: overrides.preventRecursion ?? false,
    delayUntilRecursion: overrides.delayUntilRecursion ?? 0,
    group: overrides.group ?? '',
    groupOverride: overrides.groupOverride ?? false,
    groupWeight: overrides.groupWeight ?? 100,
    useGroupScoring: overrides.useGroupScoring === undefined ? null : overrides.useGroupScoring,
    sticky: overrides.sticky === undefined ? null : overrides.sticky,
    cooldown: overrides.cooldown === undefined ? null : overrides.cooldown,
    delay: overrides.delay === undefined ? null : overrides.delay,
    characterFilterNames: overrides.characterFilterNames ?? [],
    characterFilterTags: overrides.characterFilterTags ?? [],
    characterFilterExclude: overrides.characterFilterExclude ?? false,
    triggers: overrides.triggers ?? [],
    automationId: overrides.automationId ?? '',
    addMemo: overrides.addMemo ?? false,
    probability: overrides.probability ?? 100,
    tokenCount: overrides.tokenCount ?? 1,
  };
}

function sequenceRandom(values: number[]): WorldbookScanContext['random'] {
  let index = 0;
  return {
    next() {
      const value = values[index] ?? values.at(-1)!;
      index += 1;
      return value;
    },
  };
}
