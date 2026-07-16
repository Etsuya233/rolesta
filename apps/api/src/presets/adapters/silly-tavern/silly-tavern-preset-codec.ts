import { countPromptTokens, PROMPT_TOKENIZER } from '@rolesta/shared';
import { Injectable } from '@nestjs/common';
import { PresetPortError } from '../../ports/preset-port-error.js';
import {
  PRESET_SYSTEM_PROMPT_DEFAULTS,
  PRESET_SYSTEM_PROMPTS,
  PRESET_DEFAULT_ITEM_ORDER,
  type Preset,
  type PresetEntryRole,
  type PresetGenerationType,
  type PresetPromptPlacement,
  type PresetSlot,
  type PresetSystemPrompt,
} from '../../domain/preset.js';
import { createDefaultPresetModelSettings } from '../../domain/preset-model-settings.js';
import type {
  ImportedPreset,
  PresetCodec,
  PresetImportIssue,
  ImportedPresetEntry,
  ImportedPresetPromptItem,
} from '../../ports/preset-codec.js';

const SILLY_TAVERN_CHAT_COMPLETION_PROMPT_ORDER_ID = 100001;

const identifierToKey = {
  main: 'mainPrompt',
  nsfw: 'auxiliaryPrompt',
  jailbreak: 'postHistoryInstructions',
  enhanceDefinitions: 'enhanceDefinitions',
  worldInfoBefore: 'worldInfoBefore',
  personaDescription: 'personaDescription',
  charDescription: 'characterDescription',
  charPersonality: 'characterPersonality',
  scenario: 'scenario',
  worldInfoAfter: 'worldInfoAfter',
  dialogueExamples: 'dialogueExamples',
  chatHistory: 'chatHistory',
} as const;

const keyToIdentifier = {
  mainPrompt: 'main',
  auxiliaryPrompt: 'nsfw',
  postHistoryInstructions: 'jailbreak',
  enhanceDefinitions: 'enhanceDefinitions',
  worldInfoBefore: 'worldInfoBefore',
  personaDescription: 'personaDescription',
  characterDescription: 'charDescription',
  characterPersonality: 'charPersonality',
  scenario: 'scenario',
  worldInfoAfter: 'worldInfoAfter',
  dialogueExamples: 'dialogueExamples',
  chatHistory: 'chatHistory',
} as const;

const defaultSlotNames: Record<PresetSlot, string> = {
  worldInfoBefore: 'World Info (before)',
  personaDescription: 'Persona Description',
  characterDescription: 'Char Description',
  characterPersonality: 'Char Personality',
  scenario: 'Scenario',
  worldInfoAfter: 'World Info (after)',
  dialogueExamples: 'Chat Examples',
  chatHistory: 'Chat History',
};

export interface SillyTavernPresetOutput {
  name: string;
  prompts: SillyTavernPromptOutput[];
  prompt_order: Array<{
    character_id: typeof SILLY_TAVERN_CHAT_COMPLETION_PROMPT_ORDER_ID;
    order: Array<{ identifier: string; enabled: boolean }>;
  }>;
  openai_max_context: number | null;
  openai_max_tokens: number | null;
  stream_openai: boolean;
  temperature: number | null;
  presence_penalty: number | null;
  frequency_penalty: number | null;
  repetition_penalty: number | null;
  top_p: number | null;
  top_k: number | null;
  min_p: number | null;
  top_a: number | null;
  seed: number | null;
  n: number | null;
  reasoning_effort: string;
  verbosity: string;
  show_thoughts: boolean;
}

interface SillyTavernPromptOutput {
  identifier: string;
  name: string;
  role: string;
  content: string;
  system_prompt: boolean;
  marker?: boolean;
  injection_position: number;
  injection_depth?: number;
  injection_order?: number;
  injection_trigger?: string[];
  forbid_overrides?: boolean;
  [key: string]: unknown;
}

@Injectable()
export class SillyTavernPresetCodec implements PresetCodec {
  importFile(content: Buffer): ImportedPreset {
    return fromSillyTavernPreset(importFileContent(content));
  }

  exportPreset(preset: Preset): object {
    return toSillyTavernPreset(preset);
  }
}

export function fromSillyTavernPreset(input: unknown): ImportedPreset {
  if (!isRecord(input)) {
    throw invalidPreset('input');
  }

  const prompts = promptArray(input);
  const definitions = new Map(prompts.map((prompt) => [stringField(prompt, 'identifier'), prompt]));
  const issues: PresetImportIssue[] = [];
  const entries: ImportedPresetEntry[] = [];
  const promptItems: ImportedPresetPromptItem[] = [];
  const handledIdentifiers = new Set<string>();
  const orderedIdentifiers = chatCompletionPromptOrder(input);

  for (const orderItem of orderedIdentifiers) {
    const identifier = stringField(orderItem, 'identifier');
    const definition = definitions.get(identifier);
    const name = definition ? stringField(definition, 'name') || identifier : identifier;
    const knownKey = identifierToKey[identifier as keyof typeof identifierToKey];
    if (knownKey && handledIdentifiers.has(identifier)) {
      issues.push({ identifier, name, reason: 'duplicate-system-item' });
      continue;
    }
    handledIdentifiers.add(identifier);
    const item = importOrderedItem(
      identifier,
      name,
      definition,
      booleanField(orderItem, 'enabled'),
      promptItems.length,
      issues,
    );
    if (item) {
      promptItems.push(item.item);
      if (item.entry) {
        entries.push(item.entry);
      }
    }
  }

  for (const prompt of prompts) {
    const identifier = stringField(prompt, 'identifier');
    if (handledIdentifiers.has(identifier)) {
      continue;
    }
    const name = stringField(prompt, 'name') || identifier;
    const classification = classifyPrompt(prompt, identifier);
    if (classification.kind === 'custom') {
      entries.push(toImportedEntry(prompt, identifier));
      continue;
    }
    if (
      classification.kind === 'unknown-marker' ||
      classification.kind === 'unknown-system' ||
      classification.kind === 'unsupported'
    ) {
      issues.push({ identifier, name, reason: classification.reason });
    }
  }

  const presentKeys = new Set<string>();
  for (const item of promptItems) {
    presentKeys.add(
      item.kind === 'customPrompt'
        ? item.identifier
        : item.kind === 'systemPrompt'
          ? item.systemPrompt
          : item.slot,
    );
  }
  const supplementedItems = PRESET_DEFAULT_ITEM_ORDER.filter((key) => !presentKeys.has(key));
  for (const key of supplementedItems) {
    promptItems.push(defaultImportedItem(key, promptItems.length, definitions));
  }

  return {
    name: stringField(input, 'name') || 'Untitled preset',
    modelSettings: modelSettings(input),
    tokenizer: PROMPT_TOKENIZER,
    entries,
    promptItems,
    issues,
    supplementedItems,
    sourceSnapshot: input,
  };
}

export function toSillyTavernPreset(preset: Preset): SillyTavernPresetOutput {
  const orderedItems = [...preset.promptItems].sort(
    (left, right) => left.orderIndex - right.orderIndex,
  );
  const entryById = new Map(preset.entries.map((entry) => [entry.id, entry]));
  const prompts = preset.entries.map((entry) => toSillyTavernCustomPrompt(entry));

  for (const item of orderedItems) {
    if (item.kind === 'customPrompt') {
      continue;
    }
    prompts.push(toSillyTavernSystemPrompt(item));
  }

  return {
    name: preset.name,
    prompts,
    prompt_order: [
      {
        character_id: SILLY_TAVERN_CHAT_COMPLETION_PROMPT_ORDER_ID,
        order: orderedItems.map((item) => ({
          identifier:
            item.kind === 'customPrompt'
              ? entryById.get(item.entryId)!.identifier
              : keyToIdentifier[item.kind === 'systemPrompt' ? item.systemPrompt : item.slot],
          enabled: item.enabled,
        })),
      },
    ],
    openai_max_context: preset.modelSettings.contextLength,
    openai_max_tokens: preset.modelSettings.maxResponseLength,
    stream_openai: preset.modelSettings.stream,
    temperature: preset.modelSettings.temperature,
    presence_penalty: preset.modelSettings.presencePenalty,
    frequency_penalty: preset.modelSettings.frequencyPenalty,
    repetition_penalty: preset.modelSettings.repetitionPenalty,
    top_p: preset.modelSettings.topP,
    top_k: preset.modelSettings.topK,
    min_p: preset.modelSettings.minP,
    top_a: preset.modelSettings.topA,
    seed: preset.modelSettings.seed,
    n: preset.modelSettings.n,
    reasoning_effort: preset.modelSettings.reasoningEffort,
    verbosity: preset.modelSettings.verbosity,
    show_thoughts: preset.modelSettings.showThoughts,
  };
}

function importOrderedItem(
  identifier: string,
  name: string,
  definition: Record<string, unknown> | undefined,
  enabled: boolean,
  orderIndex: number,
  issues: PresetImportIssue[],
): { item: ImportedPresetPromptItem; entry?: ImportedPresetEntry } | null {
  if (!definition) {
    const key = identifierToKey[identifier as keyof typeof identifierToKey];
    if (!key) {
      issues.push({ identifier, name, reason: 'missing-prompt-definition' });
      return null;
    }
    return {
      item: { ...defaultImportedItem(key, orderIndex, new Map()), enabled },
    };
  }

  const classification = classifyPrompt(definition, identifier);
  if (classification.kind === 'unknown-marker') {
    issues.push({ identifier, name, reason: classification.reason });
    return null;
  }
  if (classification.kind === 'unknown-system') {
    issues.push({ identifier, name, reason: classification.reason });
    return null;
  }
  if (classification.kind === 'custom') {
    return {
      item: { kind: 'customPrompt', identifier, enabled, orderIndex },
      entry: toImportedEntry(definition, identifier),
    };
  }

  const key = identifierToKey[identifier as keyof typeof identifierToKey];
  return { item: importedItemFromDefinition(key, definition, enabled, orderIndex) };
}

function defaultImportedItem(
  key: (typeof PRESET_DEFAULT_ITEM_ORDER)[number],
  orderIndex: number,
  definitions: Map<string, Record<string, unknown>>,
): ImportedPresetPromptItem {
  const definition = definitions.get(keyToIdentifier[key]);
  return definition
    ? importedItemFromDefinition(key, definition, false, orderIndex)
    : importedItemFromDefault(key, orderIndex);
}

function importedItemFromDefinition(
  key: (typeof PRESET_DEFAULT_ITEM_ORDER)[number],
  definition: Record<string, unknown>,
  enabled: boolean,
  orderIndex: number,
): ImportedPresetPromptItem {
  if (isSystemPromptKey(key)) {
    const defaults = PRESET_SYSTEM_PROMPT_DEFAULTS[key];
    const content = stringField(definition, 'content');
    const item = {
      kind: 'systemPrompt' as const,
      systemPrompt: key,
      name: stringField(definition, 'name') || defaults.name,
      role: entryRole(definition.role),
      content,
      placement: placement(definition),
      generationTypes: generationTypes(definition),
      tokenCount: countPromptTokens(content),
      enabled,
      orderIndex,
    };
    return key === 'mainPrompt' || key === 'postHistoryInstructions'
      ? { ...item, allowCharacterOverride: definition.forbid_overrides !== true }
      : item;
  }

  if (key === 'dialogueExamples' || key === 'chatHistory') {
    return { kind: 'slot', slot: key, enabled, orderIndex };
  }
  return {
    kind: 'slot',
    slot: key,
    role: entryRole(definition.role),
    placement: placement(definition),
    generationTypes: generationTypes(definition),
    enabled,
    orderIndex,
  };
}

function importedItemFromDefault(
  key: (typeof PRESET_DEFAULT_ITEM_ORDER)[number],
  orderIndex: number,
): ImportedPresetPromptItem {
  if (isSystemPromptKey(key)) {
    const definition = PRESET_SYSTEM_PROMPT_DEFAULTS[key];
    const item = {
      kind: 'systemPrompt' as const,
      systemPrompt: key,
      name: definition.name,
      role: definition.role,
      content: definition.content,
      placement: { ...definition.placement },
      generationTypes: [...definition.generationTypes],
      tokenCount: countPromptTokens(definition.content),
      enabled: false,
      orderIndex,
    };
    return definition.allowCharacterOverride === undefined
      ? item
      : { ...item, allowCharacterOverride: definition.allowCharacterOverride };
  }
  if (key === 'dialogueExamples' || key === 'chatHistory') {
    return { kind: 'slot', slot: key, enabled: false, orderIndex };
  }
  return {
    kind: 'slot',
    slot: key,
    role: 'system',
    placement: { kind: 'relative' },
    generationTypes: [],
    enabled: false,
    orderIndex,
  };
}

function toImportedEntry(prompt: Record<string, unknown>, identifier: string): ImportedPresetEntry {
  const content = stringField(prompt, 'content');
  return {
    identifier,
    name: stringField(prompt, 'name') || identifier,
    role: entryRole(prompt.role),
    content,
    placement: placement(prompt),
    generationTypes: generationTypes(prompt),
    tokenCount: countPromptTokens(content),
    metadata: Object.fromEntries(
      Object.entries(prompt).filter(
        ([key]) =>
          ![
            'identifier',
            'name',
            'role',
            'content',
            'injection_position',
            'injection_depth',
            'injection_order',
            'injection_trigger',
          ].includes(key),
      ),
    ),
  };
}

function toSillyTavernCustomPrompt(entry: Preset['entries'][number]): SillyTavernPromptOutput {
  return {
    identifier: entry.identifier,
    name: entry.name,
    role: entry.role,
    content: entry.content,
    system_prompt: false,
    injection_position: injectionPosition(entry.placement),
    ...injectionFields(entry.placement, entry.generationTypes),
    ...entry.metadata,
  };
}

function toSillyTavernSystemPrompt(
  item: Exclude<Preset['promptItems'][number], { kind: 'customPrompt' }>,
): SillyTavernPromptOutput {
  const key = item.kind === 'systemPrompt' ? item.systemPrompt : item.slot;
  const isSlot = item.kind === 'slot';
  const role = item.kind === 'systemPrompt' ? item.role : 'role' in item ? item.role : 'system';
  const content = item.kind === 'systemPrompt' ? item.content : '';
  const placement =
    item.kind === 'systemPrompt' || 'placement' in item
      ? item.placement
      : { kind: 'relative' as const };
  const prompt: SillyTavernPromptOutput = {
    identifier: keyToIdentifier[key],
    name: item.kind === 'systemPrompt' ? item.name : defaultSlotNames[item.slot],
    role,
    content,
    system_prompt: true,
    injection_position: injectionPosition(placement),
    ...(isSlot ? { marker: true } : {}),
  };
  if (
    item.kind === 'systemPrompt' &&
    (item.systemPrompt === 'mainPrompt' || item.systemPrompt === 'postHistoryInstructions')
  ) {
    prompt.forbid_overrides = !item.allowCharacterOverride;
  }
  const generationTypes =
    item.kind === 'systemPrompt' || 'generationTypes' in item ? item.generationTypes : [];
  Object.assign(prompt, injectionFields(placement, generationTypes));
  return prompt;
}

function placement(input: Record<string, unknown>): PresetPromptPlacement {
  const position = input.injection_position;
  if (position === 1 || position === 'chat') {
    return {
      kind: 'inChat',
      depth: integerField(input, 'injection_depth', 4),
      order: integerField(input, 'injection_order', 100),
    };
  }
  return { kind: 'relative' };
}

function injectionPosition(placement: PresetPromptPlacement): number {
  return placement.kind === 'inChat' ? 1 : 0;
}

function injectionFields(
  placement: PresetPromptPlacement,
  generationTypes: PresetGenerationType[],
): Record<string, unknown> {
  return {
    ...(placement.kind === 'inChat'
      ? { injection_depth: placement.depth, injection_order: placement.order }
      : {}),
    ...(generationTypes.length > 0 ? { injection_trigger: generationTypes } : {}),
  };
}

function classifyPrompt(
  prompt: Record<string, unknown>,
  identifier: string,
):
  | { kind: 'known'; key: (typeof PRESET_DEFAULT_ITEM_ORDER)[number] }
  | { kind: 'custom' }
  | { kind: 'unknown-marker'; reason: 'unknown-marker' }
  | { kind: 'unknown-system'; reason: 'unknown-system-prompt' }
  | { kind: 'unsupported'; reason: 'unsupported-prompt-type' } {
  const key = identifierToKey[identifier as keyof typeof identifierToKey];
  const marker = prompt.marker === true;
  const systemPrompt = prompt.system_prompt === true;
  if (key) {
    return { kind: 'known', key };
  }
  if (marker) {
    return { kind: 'unknown-marker', reason: 'unknown-marker' };
  }
  if (systemPrompt) {
    return { kind: 'unknown-system', reason: 'unknown-system-prompt' };
  }
  if (prompt.system_prompt === false) {
    return { kind: 'custom' };
  }
  return { kind: 'unsupported', reason: 'unsupported-prompt-type' };
}

function isSystemPromptKey(key: string): key is PresetSystemPrompt {
  return (PRESET_SYSTEM_PROMPTS as readonly string[]).includes(key);
}

function modelSettings(input: Record<string, unknown>): ImportedPreset['modelSettings'] {
  const defaults = createDefaultPresetModelSettings();
  return {
    contextLength: nullableNumberField(input, 'openai_max_context'),
    maxResponseLength: nullableNumberField(input, 'openai_max_tokens'),
    stream: optionalBooleanField(input, 'stream_openai') ?? defaults.stream,
    temperature: nullableNumberField(input, 'temperature'),
    presencePenalty: nullableNumberField(input, 'presence_penalty'),
    frequencyPenalty: nullableNumberField(input, 'frequency_penalty'),
    repetitionPenalty: nullableNumberField(input, 'repetition_penalty'),
    topP: nullableNumberField(input, 'top_p'),
    topK: nullableNumberField(input, 'top_k'),
    minP: nullableNumberField(input, 'min_p'),
    topA: nullableNumberField(input, 'top_a'),
    seed: nullableNumberField(input, 'seed'),
    n: nullableNumberField(input, 'n'),
    reasoningEffort: stringField(input, 'reasoning_effort') || defaults.reasoningEffort,
    verbosity: stringField(input, 'verbosity') || defaults.verbosity,
    showThoughts: booleanField(input, 'show_thoughts'),
  };
}

function promptArray(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const value = input.prompts;
  if (Array.isArray(value) && value.every(isRecord)) {
    return value;
  }
  throw invalidPreset('prompts');
}

function chatCompletionPromptOrder(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const value = input.prompt_order;
  if (!Array.isArray(value) || !value.every(isRecord)) {
    return [];
  }
  const selected = value.find(
    (item) => item.character_id === SILLY_TAVERN_CHAT_COMPLETION_PROMPT_ORDER_ID,
  );
  if (selected && Array.isArray(selected.order) && selected.order.every(isRecord)) {
    return selected.order;
  }
  if (
    value.every((item) => typeof item.identifier === 'string' && typeof item.enabled === 'boolean')
  ) {
    return value;
  }
  return [];
}

function entryRole(value: unknown): PresetEntryRole {
  if (value === undefined || value === null) {
    return 'system';
  }
  if (value === 'user' || value === 'assistant' || value === 'system') {
    return value;
  }
  throw invalidPreset('role');
}

function generationTypes(input: Record<string, unknown>): PresetGenerationType[] {
  const value = input.injection_trigger;
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw invalidPreset('injection_trigger');
  }
  return value.filter(
    (item): item is PresetGenerationType =>
      item === 'normal' ||
      item === 'continue' ||
      item === 'impersonate' ||
      item === 'swipe' ||
      item === 'regenerate' ||
      item === 'quiet',
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
  throw invalidPreset(key);
}

function booleanField(input: Record<string, unknown>, key: string): boolean {
  const value = input[key];
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  throw invalidPreset(key);
}

function optionalBooleanField(input: Record<string, unknown>, key: string): boolean | undefined {
  const value = input[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  throw invalidPreset(key);
}

function nullableNumberField(input: Record<string, unknown>, key: string): number | null {
  const value = input[key];
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  throw invalidPreset(key);
}

function integerField(input: Record<string, unknown>, key: string, defaultValue: number): number {
  const value = input[key];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  throw invalidPreset(key);
}

function importFileContent(content: Buffer): unknown {
  try {
    return JSON.parse(content.toString('utf8')) as unknown;
  } catch {
    throw new PresetPortError({ reason: 'invalid-import-file', params: { field: 'content' } });
  }
}

function invalidPreset(field: string): PresetPortError {
  return new PresetPortError({ reason: 'invalid-preset', params: { field } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
