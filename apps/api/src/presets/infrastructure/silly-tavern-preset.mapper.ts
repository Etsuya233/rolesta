import { countPromptTokens, PROMPT_TOKENIZER } from '@rolesta/shared';
import { PresetApplicationError } from '../application/preset-application-error.js';
import type {
  Preset,
  PresetEntry,
  PresetEntryPosition,
  PresetEntryRole,
} from '../domain/preset.js';
import {
  createDefaultPresetModelSettings,
  type PresetModelSettings,
} from '../domain/preset-model-settings.js';

export interface ImportedSillyTavernPreset {
  name: string;
  modelSettings: PresetModelSettings;
  tokenizer: typeof PROMPT_TOKENIZER;
  entries: ImportedPresetEntry[];
  promptItems: ImportedPresetPromptItem[];
  sourceSnapshot: unknown;
}

export interface ImportedPresetEntry {
  identifier: string;
  name: string;
  role: PresetEntryRole;
  position: PresetEntryPosition;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

export interface ImportedPresetPromptItem {
  identifier: string;
  enabled: boolean;
  orderIndex: number;
}

export interface SillyTavernPresetOutput {
  name: string;
  prompts: SillyTavernPromptOutput[];
  prompt_order: Array<{
    character_id: 100000;
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
  role: PresetEntryRole;
  content: string;
  injection_position: number | string;
}

export function fromSillyTavernPreset(input: unknown): ImportedSillyTavernPreset {
  if (!isRecord(input)) {
    throw new PresetApplicationError('invalid-preset');
  }

  const prompts = promptArray(input);
  const entries = prompts.map(toImportedEntry);
  const promptItems = defaultPromptOrder(input)
    .map((item, index) => toImportedPromptItem(item, index))
    .filter((item) => entries.some((entry) => entry.identifier === item.identifier));

  return {
    name: stringField(input, 'name') || 'Untitled preset',
    modelSettings: modelSettings(input),
    tokenizer: PROMPT_TOKENIZER,
    entries,
    promptItems,
    sourceSnapshot: input,
  };
}

export function toSillyTavernPreset(preset: Preset): SillyTavernPresetOutput {
  const orderedItems = [...preset.promptItems].sort((left, right) => left.orderIndex - right.orderIndex);

  return {
    name: preset.name,
    prompts: preset.entries.map(toSillyTavernPrompt),
    prompt_order: [
      {
        character_id: 100000,
        order: orderedItems
          .map((item) => {
            const entry = preset.entries.find((candidate) => candidate.id === item.entryId);
            return entry === undefined
              ? null
              : { identifier: entry.identifier, enabled: item.enabled };
          })
          .filter((item): item is { identifier: string; enabled: boolean } => item !== null),
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

function toImportedEntry(prompt: Record<string, unknown>): ImportedPresetEntry {
  const identifier = stringField(prompt, 'identifier');
  const name = stringField(prompt, 'name') || identifier || 'Untitled entry';
  const content = stringField(prompt, 'content');

  return {
    identifier: identifier || name,
    name,
    role: entryRole(prompt.role),
    position: entryPosition(prompt.injection_position),
    content,
    tokenCount: countPromptTokens(content),
    metadata: Object.fromEntries(
      Object.entries(prompt).filter(
        ([key]) =>
          !['identifier', 'name', 'role', 'content', 'injection_position'].includes(key),
      ),
    ),
  };
}

function toImportedPromptItem(
  input: Record<string, unknown>,
  orderIndex: number,
): ImportedPresetPromptItem {
  const identifier = stringField(input, 'identifier');

  return {
    identifier,
    enabled: booleanField(input, 'enabled'),
    orderIndex,
  };
}

function toSillyTavernPrompt(entry: PresetEntry): SillyTavernPromptOutput {
  return {
    identifier: entry.identifier,
    name: entry.name,
    role: entry.role,
    content: entry.content,
    injection_position: sillyTavernPosition(entry.position),
    ...entry.metadata,
  };
}

function modelSettings(input: Record<string, unknown>): PresetModelSettings {
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

  throw new PresetApplicationError('invalid-preset');
}

function defaultPromptOrder(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const promptOrder = input.prompt_order;

  if (!Array.isArray(promptOrder) || !promptOrder.every(isRecord)) {
    return [];
  }

  const selected =
    promptOrder.find((item) => item.character_id === 100000) ?? promptOrder[0];

  if (!isRecord(selected) || !Array.isArray(selected.order) || !selected.order.every(isRecord)) {
    return [];
  }

  return selected.order;
}

function entryRole(value: unknown): PresetEntryRole {
  if (value === undefined || value === null) {
    return 'system';
  }

  if (value === 'user' || value === 'assistant' || value === 'system') {
    return value;
  }

  throw new PresetApplicationError('invalid-preset');
}

function entryPosition(value: unknown): PresetEntryPosition {
  if (value === 'system' || value === 'chat' || value === 'preHistory' || value === 'postHistory') {
    return value;
  }

  if (value === 0) {
    return 'system';
  }

  if (value === 1) {
    return 'preHistory';
  }

  if (value === 2) {
    return 'postHistory';
  }

  return 'unknown';
}

function sillyTavernPosition(value: PresetEntryPosition): number | string {
  const positions: Record<PresetEntryPosition, number | string> = {
    system: 0,
    preHistory: 1,
    postHistory: 2,
    chat: 'chat',
    unknown: 'unknown',
  };

  return positions[value];
}

function stringField(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  throw new PresetApplicationError('invalid-preset');
}

function booleanField(input: Record<string, unknown>, key: string): boolean {
  const value = input[key];

  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  throw new PresetApplicationError('invalid-preset');
}

function optionalBooleanField(input: Record<string, unknown>, key: string): boolean | undefined {
  const value = input[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  throw new PresetApplicationError('invalid-preset');
}

function nullableNumberField(input: Record<string, unknown>, key: string): number | null {
  const value = input[key];

  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw new PresetApplicationError('invalid-preset');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
