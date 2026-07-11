import type { PromptTokenizer } from '@rolesta/shared';
import type { PresetModelSettings } from './preset-model-settings.js';

export const PRESET_SOURCE_FORMATS = ['sillytavern_preset', 'rolesta'] as const;
export type PresetSourceFormat = (typeof PRESET_SOURCE_FORMATS)[number];

export const PRESET_VISIBILITIES = ['private', 'public'] as const;
export type PresetVisibility = (typeof PRESET_VISIBILITIES)[number];

export const PRESET_ENTRY_ROLES = ['system', 'user', 'assistant'] as const;
export type PresetEntryRole = (typeof PRESET_ENTRY_ROLES)[number];

export const PRESET_ENTRY_POSITIONS = [
  'system',
  'chat',
  'preHistory',
  'postHistory',
  'unknown',
] as const;
export type PresetEntryPosition = (typeof PRESET_ENTRY_POSITIONS)[number];

export interface Preset {
  id: string;
  ownerUserId: string;
  visibility: PresetVisibility;
  name: string;
  modelProviderId: string | null;
  modelSettings: PresetModelSettings;
  tokenizer: PromptTokenizer;
  entries: PresetEntry[];
  promptItems: PresetPromptItem[];
  tokenCount: number;
  sourceFormat: PresetSourceFormat;
  sourceSnapshot: unknown;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface PresetSummary {
  id: string;
  ownerUserId: string;
  visibility: PresetVisibility;
  name: string;
  entryCount: number;
  promptItemCount: number;
  tokenCount: number;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface PresetEntry {
  id: string;
  presetId: string;
  identifier: string;
  name: string;
  role: PresetEntryRole;
  position: PresetEntryPosition;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface PresetPromptItem {
  entryId: string;
  enabled: boolean;
  orderIndex: number;
}

export function withPresetTokenCount(preset: Omit<Preset, 'tokenCount'>): Preset {
  const tokenCount = preset.promptItems
    .filter((item) => item.enabled)
    .reduce((total, item) => {
      const entry = preset.entries.find((candidate) => candidate.id === item.entryId);
      return total + (entry?.tokenCount ?? 0);
    }, 0);

  return { ...preset, tokenCount };
}
