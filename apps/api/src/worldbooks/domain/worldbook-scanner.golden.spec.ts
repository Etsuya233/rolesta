import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { WorldbookScanContext, WorldbookScanResult } from '../contracts/worldbook-scanning.js';
import { worldbookScanSourceFromCharacterBook } from '../adapters/silly-tavern/silly-tavern-worldbook-codec.js';
import { WorldbookScanner } from './worldbook-scanner.js';

const SILLY_TAVERN_BASELINE = '7ffb28f753b98759bc7f3ac780e2743120023657';
const fixture = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'test/fixtures/silly-tavern/worldbook-scanner-golden.json'),
    'utf8',
  ),
) as GoldenFixture;

describe('WorldbookScanner SillyTavern golden samples', () => {
  it('uses the pinned compatibility baseline and tokenizer', () => {
    expect(fixture.baseline).toEqual({
      project: 'SillyTavern',
      commit: SILLY_TAVERN_BASELINE,
      tokenizer: 'cl100k_base',
    });
  });

  for (const testCase of fixture.cases) {
    it(testCase.name, () => {
      if ('rounds' in testCase.expected) {
        const scanner = new WorldbookScanner();
        let runtimeState: WorldbookScanContext['runtimeState'] = { entries: [] };
        const rounds = testCase.input.historyRounds!.map((history) => {
          const result = scanner.scan(scanContext(testCase, history, runtimeState));
          runtimeState = result.nextRuntimeState;
          return normalizeResult(result);
        });
        expect({ rounds }).toEqual(testCase.expected);
        return;
      }

      const result = new WorldbookScanner().scan(scanContext(testCase));
      expect(normalizeResult(result)).toEqual(testCase.expected);
    });
  }
});

interface GoldenFixture {
  baseline: { project: string; commit: string; tokenizer: string };
  cases: GoldenCase[];
}

interface GoldenCase {
  name: string;
  input: {
    settings: WorldbookScanContext['settings'];
    worldbook: { name: string; entries: Record<string, Record<string, unknown>> };
    history: WorldbookScanContext['history'];
    historyRounds?: WorldbookScanContext['history'][];
    maxContextTokens: number;
    randomSequence: number[];
    globalScanData: {
      trigger: WorldbookScanContext['generationTrigger'];
      personaDescription: string;
      characterDescription: string;
      characterPersonality: string;
      characterDepthPrompt: string;
      scenario: string;
      creatorNotes: string;
    };
  };
  expected: ReturnType<typeof normalizeResult> | { rounds: ReturnType<typeof normalizeResult>[] };
}

function scanContext(
  testCase: GoldenCase,
  history = testCase.input.history,
  runtimeState: WorldbookScanContext['runtimeState'] = { entries: [] },
): WorldbookScanContext {
  const { input } = testCase;
  return {
    sources: [
      worldbookScanSourceFromCharacterBook({
        characterId: input.worldbook.name,
        characterName: input.worldbook.name,
        sourceRole: 'character',
        characterBook: input.worldbook,
      }),
    ],
    history,
    historyMessageCount: history.length,
    maxContextTokens: input.maxContextTokens,
    settings: input.settings,
    runtimeState,
    random: sequenceRandom(input.randomSequence),
    generationTrigger: input.globalScanData.trigger,
    personaDescription: input.globalScanData.personaDescription,
    character: {
      fileName: '',
      tags: [],
      description: input.globalScanData.characterDescription,
      personality: input.globalScanData.characterPersonality,
      depthPrompt: input.globalScanData.characterDepthPrompt,
      scenario: input.globalScanData.scenario,
      creatorNotes: input.globalScanData.creatorNotes,
    },
  };
}

function normalizeResult(result: WorldbookScanResult) {
  const { insertions } = result;
  return {
    activatedEntryIds: result.activatedEntries
      .map((item) => item.ref.entryId)
      .sort((left, right) => left.localeCompare(right)),
    insertions: {
      beforeCharacterDefinition: joinContents(insertions.beforeCharacterDefinition),
      afterCharacterDefinition: joinContents(insertions.afterCharacterDefinition),
      beforeAuthorsNote: contents(insertions.beforeAuthorsNote),
      afterAuthorsNote: contents(insertions.afterAuthorsNote),
      beforeExampleMessages: contents(insertions.beforeExampleMessages),
      afterExampleMessages: contents(insertions.afterExampleMessages),
      atDepth: insertions.atDepth.map((item) => ({
        depth: item.depth,
        role: roleNumber(item.role),
        entries: contents(item.entries),
      })),
      anchors: Object.fromEntries(
        Object.entries(insertions.anchors).map(([name, entries]) => [name, contents(entries)]),
      ),
    },
  };
}

function contents(entries: Array<{ content: string }>): string[] {
  return entries.map((entry) => entry.content);
}

function joinContents(entries: Array<{ content: string }>): string {
  return contents(entries).join('\n');
}

function roleNumber(role: 'system' | 'user' | 'assistant'): number {
  return { system: 0, user: 1, assistant: 2 }[role];
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
