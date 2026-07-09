import type { PromptTokenizer } from '@rolesta/shared';
import type { Preset, PresetEntryPosition, PresetEntryRole } from '../domain/preset.js';
import type { PresetModelSettings } from '../domain/preset-model-settings.js';

export const PRESET_CODEC = Symbol('PresetCodec');

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

export interface ImportedPreset {
  name: string;
  modelSettings: PresetModelSettings;
  tokenizer: PromptTokenizer;
  entries: ImportedPresetEntry[];
  promptItems: ImportedPresetPromptItem[];
  sourceSnapshot: unknown;
}

export interface PresetCodec {
  importFile(content: Buffer): ImportedPreset;
  exportPreset(preset: Preset): object;
}
