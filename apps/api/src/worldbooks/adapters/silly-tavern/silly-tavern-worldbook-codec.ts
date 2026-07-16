import { Injectable } from '@nestjs/common';
import { countPromptTokens } from '@rolesta/shared';
import type {
  Worldbook,
  WorldbookEntry,
  WorldbookEntryRole,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
} from '../../domain/worldbook.js';
import type {
  ImportedWorldbook,
  ImportedWorldbookEntry,
  ImportWorldbookFile,
  WorldbookCodec,
} from '../../ports/worldbook-codec.js';
import { WorldbookPortError } from '../../ports/worldbook-port-error.js';
import type {
  WorldbookScanSource,
  WorldbookSourceRole,
} from '../../contracts/worldbook-scanning.js';

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
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  position: number | string;
  role: number;
  selectiveLogic: number;
  order: number;
  displayIndex: number;
  depth: number;
  probability: number;
  useProbability: boolean;
  ignoreBudget: boolean;
  scanDepth: number | null;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchCharacterDepthPrompt: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
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
  characterFilter: { names: string[]; tags: string[]; isExclude: boolean };
  triggers: string[];
  automationId: string;
  addMemo: boolean;
  outletName: string;
}

@Injectable()
export class SillyTavernWorldbookCodec implements WorldbookCodec {
  importFile(file: ImportWorldbookFile): ImportedWorldbook {
    return fromSillyTavernWorldInfo(importFileContent(file), file.fileName);
  }

  exportWorldbook(worldbook: Worldbook): object {
    return toSillyTavernWorldInfo(worldbook);
  }
}

export function fromSillyTavernWorldInfo(input: unknown, fileName: string): ImportedWorldbook {
  if (!isRecord(input)) {
    throw new WorldbookPortError({
      reason: 'invalid-worldbook',
      params: { fileName, field: 'input' },
    });
  }

  const entries = entriesArray(input).map(toImportedEntry);

  return {
    name: stringField(input, 'name') || worldbookNameFromFileName(fileName),
    description: stringField(input, 'description'),
    tags: stringArrayField(input, 'tags'),
    entries,
    sourceSnapshot: input,
  };
}

export function toSillyTavernWorldInfo(worldbook: Worldbook): SillyTavernWorldInfoOutput {
  const entries = [...worldbook.entries].sort(
    (left, right) => left.displayIndex - right.displayIndex,
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
          ignoreBudget: entry.ignoreBudget,
          useProbability: entry.useProbability,
          caseSensitive: entry.caseSensitive,
          matchWholeWords: entry.matchWholeWords,
          matchPersonaDescription: entry.matchPersonaDescription,
          matchCharacterDescription: entry.matchCharacterDescription,
          matchCharacterPersonality: entry.matchCharacterPersonality,
          matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt,
          matchScenario: entry.matchScenario,
          matchCreatorNotes: entry.matchCreatorNotes,
          position: sillyTavernPosition(entry.insertionPosition),
          role: sillyTavernRole(entry.insertionRole),
          order: entry.insertionOrder,
          displayIndex: entry.displayIndex,
          depth: entry.depth,
          probability: entry.probability,
          scanDepth: entry.scanDepth,
          excludeRecursion: entry.excludeRecursion,
          preventRecursion: entry.preventRecursion,
          delayUntilRecursion: entry.delayUntilRecursion,
          group: entry.group,
          groupOverride: entry.groupOverride,
          groupWeight: entry.groupWeight,
          useGroupScoring: entry.useGroupScoring,
          sticky: entry.sticky,
          cooldown: entry.cooldown,
          delay: entry.delay,
          characterFilter: {
            names: entry.characterFilterNames,
            tags: entry.characterFilterTags,
            isExclude: entry.characterFilterExclude,
          },
          triggers: entry.triggers,
          automationId: entry.automationId,
          addMemo: entry.addMemo,
          outletName: entry.anchorName,
        },
      ]),
    ),
  };
}

function toImportedEntry(entry: Record<string, unknown>, index: number): ImportedWorldbookEntry {
  const content = stringField(entry, 'content');
  const name = stringField(entry, 'name') || stringField(entry, 'comment') || `Entry ${index + 1}`;

  return {
    enabled:
      optionalBooleanField(entry, 'enabled') ?? !(optionalBooleanField(entry, 'disable') ?? false),
    name,
    comment: stringField(entry, 'comment'),
    content,
    primaryKeys: keysField(entry, ['key', 'keys']),
    secondaryKeys: keysField(entry, ['keysecondary', 'secondaryKeys', 'secondary_keys']),
    selective: optionalBooleanField(entry, 'selective') ?? false,
    selectiveLogic: worldbookSelectiveLogic(
      compatibleField(entry, 'selectiveLogic', 'selectiveLogic'),
    ),
    constant: optionalBooleanField(entry, 'constant') ?? false,
    vectorized: optionalBooleanCompatibleField(entry, 'vectorized', 'vectorized') ?? false,
    ignoreBudget: optionalBooleanCompatibleField(entry, 'ignoreBudget', 'ignore_budget') ?? false,
    useProbability:
      optionalBooleanCompatibleField(entry, 'useProbability', 'useProbability') ?? true,
    caseSensitive: nullableBooleanCompatibleField(entry, 'caseSensitive', 'case_sensitive'),
    matchWholeWords: nullableBooleanCompatibleField(entry, 'matchWholeWords', 'match_whole_words'),
    matchPersonaDescription:
      optionalBooleanCompatibleField(
        entry,
        'matchPersonaDescription',
        'match_persona_description',
      ) ?? false,
    matchCharacterDescription:
      optionalBooleanCompatibleField(
        entry,
        'matchCharacterDescription',
        'match_character_description',
      ) ?? false,
    matchCharacterPersonality:
      optionalBooleanCompatibleField(
        entry,
        'matchCharacterPersonality',
        'match_character_personality',
      ) ?? false,
    matchCharacterDepthPrompt:
      optionalBooleanCompatibleField(
        entry,
        'matchCharacterDepthPrompt',
        'match_character_depth_prompt',
      ) ?? false,
    matchScenario:
      optionalBooleanCompatibleField(entry, 'matchScenario', 'match_scenario') ?? false,
    matchCreatorNotes:
      optionalBooleanCompatibleField(entry, 'matchCreatorNotes', 'match_creator_notes') ?? false,
    insertionPosition: worldbookInsertionPosition(compatibleField(entry, 'position', 'position')),
    insertionOrder:
      optionalNumberCompatibleField(entry, 'order', 'insertion_order') ?? 100,
    displayIndex:
      optionalNumberCompatibleField(entry, 'displayIndex', 'display_index') ?? index,
    depth: optionalNumberCompatibleField(entry, 'depth', 'depth') ?? 4,
    insertionRole: worldbookEntryRole(compatibleField(entry, 'role', 'role')),
    anchorName: stringCompatibleField(entry, 'outletName', 'outlet_name'),
    scanDepth: optionalNumberCompatibleField(entry, 'scanDepth', 'scan_depth') ?? null,
    excludeRecursion:
      optionalBooleanCompatibleField(entry, 'excludeRecursion', 'exclude_recursion') ?? false,
    preventRecursion:
      optionalBooleanCompatibleField(entry, 'preventRecursion', 'prevent_recursion') ?? false,
    delayUntilRecursion: recursionDelayLevel(entry),
    group: stringCompatibleField(entry, 'group', 'group'),
    groupOverride:
      optionalBooleanCompatibleField(entry, 'groupOverride', 'group_override') ?? false,
    groupWeight: optionalNumberCompatibleField(entry, 'groupWeight', 'group_weight') ?? 100,
    useGroupScoring: nullableBooleanCompatibleField(entry, 'useGroupScoring', 'use_group_scoring'),
    sticky: nullableNumberCompatibleField(entry, 'sticky', 'sticky'),
    cooldown: nullableNumberCompatibleField(entry, 'cooldown', 'cooldown'),
    delay: nullableNumberCompatibleField(entry, 'delay', 'delay'),
    ...characterFilterFields(entry),
    triggers: generationTriggers(entry),
    automationId: stringCompatibleField(entry, 'automationId', 'automation_id'),
    addMemo: optionalBooleanField(entry, 'addMemo') ?? false,
    probability: optionalNumberCompatibleField(entry, 'probability', 'probability') ?? 100,
    tokenCount: countPromptTokens(content),
  };
}

function entriesArray(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const entries = input.entries;

  if (Array.isArray(entries) && entries.every(isRecord)) {
    return entries;
  }

  if (isRecord(entries)) {
    const entryValues = Object.values(entries);

    if (!entryValues.every(isRecord)) {
      throw new WorldbookPortError({
        reason: 'invalid-worldbook',
        params: { field: 'entries' },
      });
    }

    return entryValues;
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: 'entries' },
  });
}

function keysField(input: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = input[key];

    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return value;
    }

    throw new WorldbookPortError({
      reason: 'invalid-worldbook',
      params: { field: key },
    });
  }

  return [];
}

function worldbookInsertionPosition(value: unknown): WorldbookInsertionPosition {
  if (
    value === 'beforeCharacterDefinition' ||
    value === 'afterCharacterDefinition' ||
    value === 'beforeAuthorsNote' ||
    value === 'afterAuthorsNote' ||
    value === 'atDepth' ||
    value === 'beforeExampleMessages' ||
    value === 'afterExampleMessages' ||
    value === 'atAnchor' ||
    value === 'unknown'
  ) {
    return value;
  }

  if (value === 'beforeChar') {
    return 'beforeCharacterDefinition';
  }

  if (value === 'before_char') {
    return 'beforeCharacterDefinition';
  }

  if (value === 'afterChar') {
    return 'afterCharacterDefinition';
  }

  if (value === 'after_char') {
    return 'afterCharacterDefinition';
  }

  if (value === 'beforeHistory') {
    return 'beforeAuthorsNote';
  }

  if (value === 'afterHistory') {
    return 'afterAuthorsNote';
  }

  if (value === undefined || value === null || value === 0) {
    return 'beforeCharacterDefinition';
  }

  if (value === 1) {
    return 'afterCharacterDefinition';
  }

  if (value === 2) {
    return 'beforeAuthorsNote';
  }

  if (value === 3) {
    return 'afterAuthorsNote';
  }

  if (value === 4) {
    return 'atDepth';
  }

  if (value === 5) {
    return 'beforeExampleMessages';
  }

  if (value === 6) {
    return 'afterExampleMessages';
  }

  if (value === 7) {
    return 'atAnchor';
  }

  return 'unknown';
}

function worldbookEntryRole(value: unknown): WorldbookEntryRole {
  if (value === 'system' || value === undefined || value === null || value === 0) {
    return 'system';
  }

  if (value === 'user' || value === 1) {
    return 'user';
  }

  if (value === 'assistant' || value === 2) {
    return 'assistant';
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: 'role' },
  });
}

function worldbookSelectiveLogic(value: unknown): WorldbookSelectiveLogic {
  if (value === 'andAny' || value === undefined || value === null || value === 0) {
    return 'andAny';
  }

  if (value === 'notAll' || value === 1) {
    return 'notAll';
  }

  if (value === 'notAny' || value === 2) {
    return 'notAny';
  }

  if (value === 'andAll' || value === 3) {
    return 'andAll';
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: 'selectiveLogic' },
  });
}

function sillyTavernPosition(position: WorldbookInsertionPosition): number | string {
  const positions: Record<WorldbookInsertionPosition, number | string> = {
    beforeCharacterDefinition: 0,
    afterCharacterDefinition: 1,
    beforeAuthorsNote: 2,
    afterAuthorsNote: 3,
    atDepth: 4,
    beforeExampleMessages: 5,
    afterExampleMessages: 6,
    atAnchor: 7,
    unknown: 'unknown',
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
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: directKey },
  });
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

  if (typeof value === 'boolean') {
    return value;
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: directKey },
  });
}

export function worldbookScanSourceFromWorldbook(worldbook: Worldbook): WorldbookScanSource {
  return {
    sourceType: 'standalone',
    sourceAssetId: worldbook.id,
    sourceRole: 'independent',
    name: worldbook.name,
    entries: worldbook.entries.map(toWorldbookScanEntry),
  };
}

export function worldbookScanSourceFromCharacterBook(input: {
  characterId: string;
  characterName: string;
  sourceRole: Extract<WorldbookSourceRole, 'character' | 'persona'>;
  characterBook: Record<string, unknown>;
}): WorldbookScanSource {
  const rawEntries = entriesArray(input.characterBook);
  return {
    sourceType: 'characterCard',
    sourceAssetId: input.characterId,
    sourceRole: input.sourceRole,
    name: input.characterName,
    entries: rawEntries.map((rawEntry, index) => ({
      id: embeddedWorldbookEntryId(rawEntry, index),
      ...toImportedEntry(rawEntry, index),
    })),
  };
}

function toWorldbookScanEntry(entry: WorldbookEntry): WorldbookScanSource['entries'][number] {
  return {
    id: entry.id,
    enabled: entry.enabled,
    name: entry.name,
    comment: entry.comment,
    content: entry.content,
    primaryKeys: entry.primaryKeys,
    secondaryKeys: entry.secondaryKeys,
    selective: entry.selective,
    selectiveLogic: entry.selectiveLogic,
    constant: entry.constant,
    vectorized: entry.vectorized,
    ignoreBudget: entry.ignoreBudget,
    useProbability: entry.useProbability,
    caseSensitive: entry.caseSensitive,
    matchWholeWords: entry.matchWholeWords,
    matchPersonaDescription: entry.matchPersonaDescription,
    matchCharacterDescription: entry.matchCharacterDescription,
    matchCharacterPersonality: entry.matchCharacterPersonality,
    matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt,
    matchScenario: entry.matchScenario,
    matchCreatorNotes: entry.matchCreatorNotes,
    insertionPosition: entry.insertionPosition,
    insertionOrder: entry.insertionOrder,
    depth: entry.depth,
    insertionRole: entry.insertionRole,
    anchorName: entry.anchorName,
    scanDepth: entry.scanDepth,
    excludeRecursion: entry.excludeRecursion,
    preventRecursion: entry.preventRecursion,
    delayUntilRecursion: entry.delayUntilRecursion,
    group: entry.group,
    groupOverride: entry.groupOverride,
    groupWeight: entry.groupWeight,
    useGroupScoring: entry.useGroupScoring,
    sticky: entry.sticky,
    cooldown: entry.cooldown,
    delay: entry.delay,
    characterFilterNames: entry.characterFilterNames,
    characterFilterTags: entry.characterFilterTags,
    characterFilterExclude: entry.characterFilterExclude,
    triggers: entry.triggers,
    automationId: entry.automationId,
    addMemo: entry.addMemo,
    probability: entry.probability,
    tokenCount: entry.tokenCount,
  };
}

function embeddedWorldbookEntryId(entry: Record<string, unknown>, index: number): string {
  const value = entry.id ?? entry.uid;

  if (value === undefined || value === null) {
    return String(index);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: 'id' },
  });
}

function nullableBooleanCompatibleField(
  input: Record<string, unknown>,
  directKey: string,
  extensionKey: string,
): boolean | null {
  return optionalBooleanCompatibleField(input, directKey, extensionKey) ?? null;
}

function optionalNumberCompatibleField(
  input: Record<string, unknown>,
  directKey: string,
  extensionKey: string,
): number | undefined {
  const value = compatibleField(input, directKey, extensionKey);

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: directKey },
  });
}

function nullableNumberCompatibleField(
  input: Record<string, unknown>,
  directKey: string,
  extensionKey: string,
): number | null {
  return optionalNumberCompatibleField(input, directKey, extensionKey) ?? null;
}

function recursionDelayLevel(entry: Record<string, unknown>): number {
  const value = compatibleField(entry, 'delayUntilRecursion', 'delay_until_recursion');

  if (value === undefined || value === null || value === false) {
    return 0;
  }

  if (value === true) {
    return 1;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: 'delayUntilRecursion' },
  });
}

function characterFilterFields(
  entry: Record<string, unknown>,
): Pick<
  ImportedWorldbookEntry,
  'characterFilterNames' | 'characterFilterTags' | 'characterFilterExclude'
> {
  const extensions = isRecord(entry.extensions) ? entry.extensions : {};
  const value = entry.characterFilter ?? entry.character_filter ?? extensions.character_filter;

  if (value === undefined || value === null) {
    return {
      characterFilterNames: [],
      characterFilterTags: [],
      characterFilterExclude: false,
    };
  }

  if (!isRecord(value)) {
    throw new WorldbookPortError({
      reason: 'invalid-worldbook',
      params: { field: 'characterFilter' },
    });
  }

  return {
    characterFilterNames: stringArrayField(value, 'names'),
    characterFilterTags: stringArrayField(value, 'tags'),
    characterFilterExclude: optionalBooleanField(value, 'isExclude') ?? false,
  };
}

function generationTriggers(entry: Record<string, unknown>): ImportedWorldbookEntry['triggers'] {
  const extensions = isRecord(entry.extensions) ? entry.extensions : {};
  const value = entry.triggers ?? extensions.triggers;

  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new WorldbookPortError({
      reason: 'invalid-worldbook',
      params: { field: 'triggers' },
    });
  }

  const known = new Set<ImportedWorldbookEntry['triggers'][number]>([
    'normal',
    'continue',
    'impersonate',
    'swipe',
    'regenerate',
    'quiet',
  ]);
  return value.filter((item): item is ImportedWorldbookEntry['triggers'][number] =>
    known.has(item as never),
  );
}

function stringField(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: key },
  });
}

function stringArrayField(input: Record<string, unknown>, key: string): string[] {
  const value = input[key];

  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value;
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: key },
  });
}

function optionalBooleanField(input: Record<string, unknown>, key: string): boolean | undefined {
  const value = input[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  throw new WorldbookPortError({
    reason: 'invalid-worldbook',
    params: { field: key },
  });
}

function importFileContent(file: ImportWorldbookFile): unknown {
  try {
    return JSON.parse(file.content.toString('utf8')) as unknown;
  } catch (error) {
    throw new WorldbookPortError({
      reason: 'invalid-import-file',
      params: { fileName: file.fileName, field: 'content' },
      cause: error,
    });
  }
}

function worldbookNameFromFileName(fileName: string): string {
  const lastSegment = fileName.split(/[\\/]/).at(-1) ?? '';
  const extensionIndex = lastSegment.lastIndexOf('.');

  if (extensionIndex > 0) {
    return lastSegment.slice(0, extensionIndex) || 'Untitled worldbook';
  }

  return lastSegment || 'Untitled worldbook';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
