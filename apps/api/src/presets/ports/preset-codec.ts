import type { PromptTokenizer } from '@rolesta/shared';
import type {
  Preset,
  PresetContentSlot,
  PresetEntryRole,
  PresetGenerationType,
  PresetPromptPlacement,
  PresetStructuralSlot,
  PresetSystemItemKey,
  PresetSystemPrompt,
} from '../domain/preset.js';
import type { PresetModelSettings } from '../domain/preset-model-settings.js';

export const PRESET_CODEC = Symbol('PresetCodec');

export const PRESET_IMPORT_ISSUE_REASONS = [
  'unknown-marker',
  'unknown-system-prompt',
  'duplicate-system-item',
  'missing-prompt-definition',
  'unsupported-prompt-type',
] as const;
export type PresetImportIssueReason = (typeof PRESET_IMPORT_ISSUE_REASONS)[number];

export interface PresetImportIssue {
  identifier: string;
  name: string;
  reason: PresetImportIssueReason;
}

export interface ImportedPresetEntry {
  identifier: string;
  name: string;
  role: PresetEntryRole;
  content: string;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  tokenCount: number;
  metadata: Record<string, unknown>;
}

interface ImportedOrderedPromptItem {
  enabled: boolean;
  orderIndex: number;
}

export interface ImportedCustomPromptItem extends ImportedOrderedPromptItem {
  kind: 'customPrompt';
  identifier: string;
}

export interface ImportedSystemPromptItem extends ImportedOrderedPromptItem {
  kind: 'systemPrompt';
  systemPrompt: PresetSystemPrompt;
  name: string;
  role: PresetEntryRole;
  content: string;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  allowCharacterOverride?: boolean;
  tokenCount: number;
}

export interface ImportedContentSlotItem extends ImportedOrderedPromptItem {
  kind: 'slot';
  slot: PresetContentSlot;
  role: PresetEntryRole;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
}

export interface ImportedStructuralSlotItem extends ImportedOrderedPromptItem {
  kind: 'slot';
  slot: PresetStructuralSlot;
}

export type ImportedPresetPromptItem =
  | ImportedCustomPromptItem
  | ImportedSystemPromptItem
  | ImportedContentSlotItem
  | ImportedStructuralSlotItem;

export interface ImportedPreset {
  name: string;
  modelSettings: PresetModelSettings;
  tokenizer: PromptTokenizer;
  entries: ImportedPresetEntry[];
  promptItems: ImportedPresetPromptItem[];
  issues: PresetImportIssue[];
  supplementedItems: PresetSystemItemKey[];
  sourceSnapshot: unknown;
}

export interface PresetCodec {
  importFile(content: Buffer): ImportedPreset;
  exportPreset(preset: Preset): object;
}
