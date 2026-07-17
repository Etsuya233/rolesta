import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from '@playwright/test';

const SILLY_TAVERN_COMMIT = '7ffb28f753b98759bc7f3ac780e2743120023657';
const ORACLE_PORT = 18101;
const ORACLE_URL = `http://127.0.0.1:${ORACLE_PORT}`;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(scriptDirectory, '../../..');
const outputPath = resolve(
  scriptDirectory,
  '../../api/test/fixtures/silly-tavern/worldbook-scanner-golden.json',
);

interface GoldenHistoryMessage {
  name: string;
  content: string;
}

interface GoldenSettings {
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
  characterLoreInsertionStrategy: 'evenly' | 'characterFirst' | 'globalFirst';
}

interface GoldenGlobalScanData {
  trigger: string;
  personaDescription: string;
  characterDescription: string;
  characterPersonality: string;
  characterDepthPrompt: string;
  scenario: string;
  creatorNotes: string;
}

interface GoldenCase {
  name: string;
  input: {
    settings: GoldenSettings;
    worldbook: { name: string; entries: Record<string, Record<string, unknown>> };
    history: GoldenHistoryMessage[];
    historyRounds?: GoldenHistoryMessage[][];
    maxContextTokens: number;
    randomSequence: number[];
    globalScanData: GoldenGlobalScanData;
  };
}

interface NormalizedOracleResult {
  activatedEntryIds: string[];
  insertions: {
    beforeCharacterDefinition: string;
    afterCharacterDefinition: string;
    beforeAuthorsNote: string[];
    afterAuthorsNote: string[];
    beforeExampleMessages: string[];
    afterExampleMessages: string[];
    atDepth: Array<{ depth: number; role: number; entries: string[] }>;
    anchors: Record<string, string[]>;
  };
}

interface SillyTavernWorldInfoResult {
  worldInfoBefore: string;
  worldInfoAfter: string;
  EMEntries: Array<{ position: number; content: string }>;
  WIDepthEntries: Array<{ depth: number; role: number; entries: string[] }>;
  ANBeforeEntries: string[];
  ANAfterEntries: string[];
  outletEntries: Record<string, string[]>;
  allActivatedEntries: Set<{ uid: string | number }>;
}

interface SillyTavernWorldInfoModule {
  updateWorldInfoSettings(settings: Record<string, unknown>, activeWorldInfo: string[]): void;
  saveWorldInfo(
    name: string,
    worldbook: GoldenCase['input']['worldbook'],
    immediately: boolean,
  ): Promise<void>;
  checkWorldInfo(
    chat: string[],
    maxContextTokens: number,
    isDryRun: boolean,
    globalScanData: GoldenGlobalScanData,
  ): Promise<SillyTavernWorldInfoResult>;
}

interface SillyTavernPowerUserModule {
  power_user: { tokenizer: number };
}

interface SillyTavernTokenizerModule {
  tokenizers: { OPENAI: number };
}

interface SillyTavernScriptModule {
  chat_metadata: { timedWorldInfo?: Record<string, unknown> };
}

const defaultSettings: GoldenSettings = {
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
};

const emptyGlobalScanData: GoldenGlobalScanData = {
  trigger: 'normal',
  personaDescription: '',
  characterDescription: '',
  characterPersonality: '',
  characterDepthPrompt: '',
  scenario: '',
  creatorNotes: '',
};

const cases: GoldenCase[] = [
  goldenCase('activation-and-insertion', {
    history: [
      { name: 'User', content: 'The silver gate leads to Eldoria.' },
      { name: 'Seraphina', content: 'The forest is quiet.' },
    ],
    entries: [
      entry(0, {
        key: ['silver gate'],
        content: 'Gate lore',
        position: 0,
        order: 100,
      }),
      entry(1, {
        key: ['eldoria'],
        keysecondary: ['silver', 'gate'],
        selective: true,
        selectiveLogic: 3,
        content: 'Eldoria lore',
        position: 1,
        order: 50,
      }),
      entry(2, {
        key: ['eldoria'],
        keysecondary: ['forest'],
        selective: true,
        selectiveLogic: 2,
        content: 'Wrong lore',
      }),
      entry(3, {
        content: '@@activate\nAlways active',
        position: 4,
        depth: 2,
        role: 2,
      }),
      entry(4, { constant: true, content: '@@dont_activate\nNever active' }),
    ],
  }),
  goldenCase('recursion-probability-and-groups', {
    history: [{ name: 'User', content: 'alpha' }],
    settings: { recursive: true, budgetPercent: 100 },
    randomSequence: [0.8, 0.75],
    entries: [
      entry(0, { key: ['alpha'], content: 'beta', order: 100 }),
      entry(1, { key: ['beta'], content: 'recursive lore', order: 90 }),
      entry(2, {
        constant: true,
        useProbability: true,
        probability: 20,
        content: 'probability lore',
        order: 80,
      }),
      entry(3, {
        constant: true,
        group: 'weather',
        groupWeight: 25,
        content: 'light weather',
        order: 70,
      }),
      entry(4, {
        constant: true,
        group: 'weather',
        groupWeight: 75,
        content: 'heavy weather',
        order: 60,
      }),
    ],
  }),
  goldenCase('context-matching-and-ordered-insertions', {
    history: [{ name: 'User', content: 'ELDORIA' }],
    settings: { caseSensitive: true },
    globalScanData: { creatorNotes: 'The hidden archive' },
    entries: [
      entry(0, { key: ['eldoria'], content: 'case inherited' }),
      entry(1, { key: ['eldoria'], caseSensitive: false, content: 'case override' }),
      entry(2, {
        key: ['archive'],
        matchCreatorNotes: true,
        content: 'creator notes lore',
      }),
      entry(3, {
        constant: true,
        position: 7,
        outletName: 'lore',
        order: 50,
        content: 'lower priority',
      }),
      entry(4, {
        constant: true,
        position: 7,
        outletName: 'lore',
        order: 100,
        content: 'higher priority',
      }),
      entry(5, { constant: true, position: 2, content: 'before authors note' }),
      entry(6, { constant: true, position: 3, content: 'after authors note' }),
      entry(7, { constant: true, position: 5, content: 'before examples' }),
      entry(8, { constant: true, position: 6, content: 'after examples' }),
    ],
  }),
  goldenCase('token-budget-and-ignore-budget', {
    maxContextTokens: 40,
    settings: { budgetPercent: 25 },
    entries: [
      entry(0, { constant: true, order: 100, content: 'one two' }),
      entry(1, {
        constant: true,
        order: 90,
        content: 'three four five six seven eight nine ten',
      }),
      entry(2, {
        constant: true,
        ignoreBudget: true,
        order: 80,
        content: 'ignored budget entry',
      }),
    ],
  }),
  goldenCase('sticky-cooldown-and-delay-across-rounds', {
    historyRounds: [
      [{ name: 'User', content: 'alpha' }],
      [
        { name: 'User', content: 'alpha' },
        { name: 'Seraphina', content: 'acknowledged' },
      ],
      [
        { name: 'User', content: 'alpha' },
        { name: 'Seraphina', content: 'acknowledged' },
        { name: 'User', content: 'continue' },
      ],
      [
        { name: 'User', content: 'alpha' },
        { name: 'Seraphina', content: 'acknowledged' },
        { name: 'User', content: 'continue' },
        { name: 'Seraphina', content: 'waiting' },
      ],
      [
        { name: 'User', content: 'alpha' },
        { name: 'Seraphina', content: 'acknowledged' },
        { name: 'User', content: 'continue' },
        { name: 'Seraphina', content: 'waiting' },
        { name: 'User', content: 'continue' },
        { name: 'Seraphina', content: 'done' },
      ],
    ],
    entries: [
      entry(0, {
        key: ['alpha'],
        sticky: 2,
        cooldown: 3,
        content: 'timed lore',
        order: 100,
      }),
      entry(1, {
        constant: true,
        delay: 2,
        content: 'delayed lore',
        order: 90,
      }),
    ],
  }),
];

const sillyTavernDirectory = process.env.SILLY_TAVERN_DIR;
if (!sillyTavernDirectory) {
  throw new Error('SILLY_TAVERN_DIR must point to a SillyTavern checkout at the pinned commit');
}

verifyBaseline(sillyTavernDirectory);
const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'rolesta-worldbook-oracle-'));
const dataDirectory = resolve(temporaryDirectory, 'data');
await mkdir(dataDirectory);

let server: ChildProcess | undefined;
let browser: Browser | undefined;

try {
  server = startSillyTavern(sillyTavernDirectory, temporaryDirectory, dataDirectory);
  await waitForServer(server);
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(ORACLE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.readyState === 'complete');

  const generatedCases = [];
  for (const testCase of cases) {
    const expected = await runOracleCase(page, testCase);
    generatedCases.push({ ...testCase, expected });
  }

  const fixture = {
    baseline: {
      project: 'SillyTavern',
      commit: SILLY_TAVERN_COMMIT,
      tokenizer: 'cl100k_base',
    },
    cases: generatedCases,
  };

  await writeFile(outputPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
  execFileSync(
    process.execPath,
    [resolve(repositoryDirectory, 'node_modules/prettier/bin/prettier.cjs'), '--write', outputPath],
    {
      cwd: repositoryDirectory,
      stdio: 'inherit',
    },
  );
  console.log(`Generated ${generatedCases.length} worldbook golden cases at ${outputPath}`);
} finally {
  await browser?.close();
  server?.kill();
  await rm(temporaryDirectory, { force: true, recursive: true });
}

function verifyBaseline(sillyTavernDirectory: string): void {
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: sillyTavernDirectory,
    encoding: 'utf8',
  }).trim();

  if (commit !== SILLY_TAVERN_COMMIT) {
    throw new Error(`Expected SillyTavern ${SILLY_TAVERN_COMMIT}, received ${commit}`);
  }
}

function startSillyTavern(
  sillyTavernDirectory: string,
  temporaryDirectory: string,
  dataDirectory: string,
): ChildProcess {
  return spawn(
    process.execPath,
    [
      'server.js',
      '--port',
      String(ORACLE_PORT),
      '--browserLaunchEnabled',
      'false',
      '--dataRoot',
      dataDirectory,
      '--configPath',
      resolve(temporaryDirectory, 'config.yaml'),
      '--disableCsrf',
    ],
    {
      cwd: sillyTavernDirectory,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );
}

async function waitForServer(server: ChildProcess): Promise<void> {
  const deadline = Date.now() + 120_000;
  let stderr = '';
  server.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`SillyTavern exited before startup:\n${stderr}`);
    }

    try {
      const response = await fetch(ORACLE_URL);
      if (response.ok) return;
    } catch {
      // The fixed ST process is still starting.
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }

  throw new Error(`SillyTavern did not start within 120 seconds:\n${stderr}`);
}

async function runOracleCase(
  page: Page,
  testCase: GoldenCase,
): Promise<NormalizedOracleResult | { rounds: NormalizedOracleResult[] }> {
  return page.evaluate(async (input) => {
    const worldInfoModulePath = '/scripts/world-info.js';
    const powerUserModulePath = '/scripts/power-user.js';
    const tokenizerModulePath = '/scripts/tokenizers.js';
    const scriptModulePath = '/script.js';
    const worldInfoModule = (await import(
      worldInfoModulePath
    )) as unknown as SillyTavernWorldInfoModule;
    const powerUserModule = (await import(
      powerUserModulePath
    )) as unknown as SillyTavernPowerUserModule;
    const tokenizerModule = (await import(
      tokenizerModulePath
    )) as unknown as SillyTavernTokenizerModule;
    powerUserModule.power_user.tokenizer = tokenizerModule.tokenizers.OPENAI;

    const strategy = { evenly: 0, characterFirst: 1, globalFirst: 2 }[
      input.settings.characterLoreInsertionStrategy
    ];
    worldInfoModule.updateWorldInfoSettings(
      {
        world_info_depth: input.settings.scanDepth,
        world_info_min_activations: input.settings.minActivations,
        world_info_min_activations_depth_max: input.settings.minActivationsDepthMax,
        world_info_budget: input.settings.budgetPercent,
        world_info_include_names: input.settings.includeNames,
        world_info_recursive: input.settings.recursive,
        world_info_overflow_alert: false,
        world_info_case_sensitive: input.settings.caseSensitive,
        world_info_match_whole_words: input.settings.matchWholeWords,
        world_info_character_strategy: strategy,
        world_info_budget_cap: input.settings.budgetCap,
        world_info_use_group_scoring: input.settings.useGroupScoring,
        world_info_max_recursion_steps: input.settings.maxRecursionSteps,
      },
      [input.worldbook.name],
    );
    await worldInfoModule.saveWorldInfo(input.worldbook.name, input.worldbook, true);
    const scriptModule = (await import(scriptModulePath)) as unknown as SillyTavernScriptModule;
    scriptModule.chat_metadata.timedWorldInfo = {};

    const originalRandom = Math.random;
    let randomIndex = 0;
    Math.random = () => input.randomSequence[randomIndex++] ?? input.randomSequence.at(-1) ?? 0;

    try {
      const histories = input.historyRounds ?? [input.history];
      const rounds = [];
      for (const history of histories) {
        const chat = [...history]
          .reverse()
          .map((message) =>
            input.settings.includeNames ? `${message.name}: ${message.content}` : message.content,
          );
        const result = await worldInfoModule.checkWorldInfo(
          chat,
          input.maxContextTokens,
          !input.historyRounds,
          input.globalScanData,
        );
        const exampleEntries = result.EMEntries;

        rounds.push({
          activatedEntryIds: [...result.allActivatedEntries]
            .map((item: { uid: string | number }) => String(item.uid))
            .sort(),
          insertions: {
            beforeCharacterDefinition: result.worldInfoBefore,
            afterCharacterDefinition: result.worldInfoAfter,
            beforeAuthorsNote: result.ANBeforeEntries,
            afterAuthorsNote: result.ANAfterEntries,
            beforeExampleMessages: exampleEntries
              .filter((item) => item.position === 0)
              .map((item) => item.content),
            afterExampleMessages: exampleEntries
              .filter((item) => item.position === 1)
              .map((item) => item.content),
            atDepth: result.WIDepthEntries.map((item) => ({
              depth: item.depth,
              role: item.role,
              entries: item.entries,
            })),
            anchors: result.outletEntries,
          },
        });
      }

      if (input.historyRounds) {
        return { rounds };
      }

      return rounds[0]!;
    } finally {
      Math.random = originalRandom;
    }
  }, testCase.input);
}

function goldenCase(
  name: string,
  overrides: {
    entries: Array<Record<string, unknown>>;
    history?: GoldenHistoryMessage[];
    historyRounds?: GoldenHistoryMessage[][];
    settings?: Partial<GoldenSettings>;
    maxContextTokens?: number;
    randomSequence?: number[];
    globalScanData?: Partial<GoldenGlobalScanData>;
  },
): GoldenCase {
  return {
    name,
    input: {
      settings: { ...defaultSettings, ...overrides.settings },
      worldbook: {
        name: `rolesta-golden-${name}`,
        entries: Object.fromEntries(overrides.entries.map((item, index) => [String(index), item])),
      },
      history: overrides.history ?? [],
      ...(overrides.historyRounds ? { historyRounds: overrides.historyRounds } : {}),
      maxContextTokens: overrides.maxContextTokens ?? 4096,
      randomSequence: overrides.randomSequence ?? [0],
      globalScanData: { ...emptyGlobalScanData, ...overrides.globalScanData },
    },
  };
}

function entry(uid: number, overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    uid,
    key: [],
    keysecondary: [],
    comment: `entry-${uid}`,
    content: 'lore',
    disable: false,
    constant: false,
    vectorized: false,
    selective: false,
    selectiveLogic: 0,
    ignoreBudget: false,
    useProbability: true,
    caseSensitive: null,
    matchWholeWords: null,
    matchPersonaDescription: false,
    matchCharacterDescription: false,
    matchCharacterPersonality: false,
    matchCharacterDepthPrompt: false,
    matchScenario: false,
    matchCreatorNotes: false,
    position: 0,
    role: 0,
    order: 0,
    displayIndex: uid,
    depth: 4,
    probability: 100,
    scanDepth: null,
    excludeRecursion: false,
    preventRecursion: false,
    delayUntilRecursion: 0,
    group: '',
    groupOverride: false,
    groupWeight: 100,
    useGroupScoring: null,
    sticky: null,
    cooldown: null,
    delay: null,
    characterFilter: { names: [], tags: [], isExclude: false },
    triggers: [],
    automationId: '',
    addMemo: true,
    outletName: '',
    ...overrides,
  };
}
