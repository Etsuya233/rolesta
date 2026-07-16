import { countPromptTokens, type PromptTokenizer } from '@rolesta/shared';
import type { PresetModelSettings } from './preset-model-settings.js';
import { PresetDomainError } from './preset-domain-error.js';

export const PRESET_SOURCE_FORMATS = ['sillytavern_preset', 'rolesta'] as const;
export type PresetSourceFormat = (typeof PRESET_SOURCE_FORMATS)[number];

export const PRESET_VISIBILITIES = ['private', 'public'] as const;
export type PresetVisibility = (typeof PRESET_VISIBILITIES)[number];

export const PRESET_ENTRY_ROLES = ['system', 'user', 'assistant'] as const;
export type PresetEntryRole = (typeof PRESET_ENTRY_ROLES)[number];

export const PRESET_GENERATION_TYPES = [
  'normal',
  'continue',
  'impersonate',
  'swipe',
  'regenerate',
  'quiet',
] as const;
export type PresetGenerationType = (typeof PRESET_GENERATION_TYPES)[number];

export const PRESET_CONTENT_SLOTS = [
  'worldInfoBefore',
  'personaDescription',
  'characterDescription',
  'characterPersonality',
  'scenario',
  'worldInfoAfter',
] as const;
export type PresetContentSlot = (typeof PRESET_CONTENT_SLOTS)[number];

export const PRESET_STRUCTURAL_SLOTS = ['dialogueExamples', 'chatHistory'] as const;
export type PresetStructuralSlot = (typeof PRESET_STRUCTURAL_SLOTS)[number];

export const PRESET_SLOTS = [...PRESET_CONTENT_SLOTS, ...PRESET_STRUCTURAL_SLOTS] as const;
export type PresetSlot = (typeof PRESET_SLOTS)[number];

export const PRESET_SYSTEM_PROMPTS = [
  'mainPrompt',
  'auxiliaryPrompt',
  'enhanceDefinitions',
  'postHistoryInstructions',
] as const;
export type PresetSystemPrompt = (typeof PRESET_SYSTEM_PROMPTS)[number];

export const PRESET_SYSTEM_ITEM_KEYS = [...PRESET_SYSTEM_PROMPTS, ...PRESET_SLOTS] as const;
export type PresetSystemItemKey = (typeof PRESET_SYSTEM_ITEM_KEYS)[number];

export const PRESET_DEFAULT_ITEM_ORDER: readonly PresetSystemItemKey[] = [
  'mainPrompt',
  'worldInfoBefore',
  'personaDescription',
  'characterDescription',
  'characterPersonality',
  'scenario',
  'enhanceDefinitions',
  'auxiliaryPrompt',
  'worldInfoAfter',
  'dialogueExamples',
  'chatHistory',
  'postHistoryInstructions',
];

export const SILLY_TAVERN_RESERVED_PRESET_IDENTIFIERS = [
  'main',
  'nsfw',
  'jailbreak',
  'enhanceDefinitions',
  'worldInfoBefore',
  'personaDescription',
  'charDescription',
  'charPersonality',
  'scenario',
  'worldInfoAfter',
  'dialogueExamples',
  'chatHistory',
] as const;
export type SillyTavernReservedPresetIdentifier =
  (typeof SILLY_TAVERN_RESERVED_PRESET_IDENTIFIERS)[number];

export type PresetPromptPlacement =
  { kind: 'relative' } | { kind: 'inChat'; depth: number; order: number };

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
  content: string;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAtMs: number;
  updatedAtMs: number;
}

interface OrderedPresetPromptItem {
  id: string;
  enabled: boolean;
  orderIndex: number;
}

export interface PresetCustomPromptItem extends OrderedPresetPromptItem {
  kind: 'customPrompt';
  entryId: string;
}

export interface PresetSystemPromptItem extends OrderedPresetPromptItem {
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

export interface PresetContentSlotItem extends OrderedPresetPromptItem {
  kind: 'slot';
  slot: PresetContentSlot;
  role: PresetEntryRole;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
}

export interface PresetStructuralSlotItem extends OrderedPresetPromptItem {
  kind: 'slot';
  slot: PresetStructuralSlot;
}

export type PresetSlotItem = PresetContentSlotItem | PresetStructuralSlotItem;
export type PresetPromptItem = PresetSlotItem | PresetSystemPromptItem | PresetCustomPromptItem;

export interface PresetSystemPromptDefault {
  systemPrompt: PresetSystemPrompt;
  name: string;
  role: PresetEntryRole;
  content: string;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  allowCharacterOverride?: boolean;
  enabled: boolean;
}

const relativePlacement: PresetPromptPlacement = { kind: 'relative' };

export const PRESET_SYSTEM_PROMPT_DEFAULTS: Readonly<
  Record<PresetSystemPrompt, PresetSystemPromptDefault>
> = {
  mainPrompt: {
    systemPrompt: 'mainPrompt',
    name: 'Main Prompt',
    role: 'system',
    content:
      "Write {{char}}'s next reply in a fictional chat between {{charIfNotGroup}} and {{user}}.",
    placement: relativePlacement,
    generationTypes: [],
    allowCharacterOverride: true,
    enabled: true,
  },
  auxiliaryPrompt: {
    systemPrompt: 'auxiliaryPrompt',
    name: 'Auxiliary Prompt',
    role: 'system',
    content: '',
    placement: relativePlacement,
    generationTypes: [],
    enabled: true,
  },
  enhanceDefinitions: {
    systemPrompt: 'enhanceDefinitions',
    name: 'Enhance Definitions',
    role: 'system',
    content:
      "If you have more knowledge of {{char}}, add to the character's lore and personality to enhance them but keep the Character Sheet's definitions absolute.",
    placement: relativePlacement,
    generationTypes: [],
    enabled: false,
  },
  postHistoryInstructions: {
    systemPrompt: 'postHistoryInstructions',
    name: 'Post-History Instructions',
    role: 'system',
    content: '',
    placement: relativePlacement,
    generationTypes: [],
    allowCharacterOverride: true,
    enabled: true,
  },
};

export function createDefaultPresetPromptItems(createId: () => string): PresetPromptItem[] {
  return PRESET_DEFAULT_ITEM_ORDER.map((key, orderIndex) => {
    if (isPresetSystemPrompt(key)) {
      const definition = PRESET_SYSTEM_PROMPT_DEFAULTS[key];

      return {
        id: createId(),
        kind: 'systemPrompt',
        systemPrompt: key,
        name: definition.name,
        role: definition.role,
        content: definition.content,
        placement: { ...definition.placement },
        generationTypes: [...definition.generationTypes],
        ...(definition.allowCharacterOverride === undefined
          ? {}
          : { allowCharacterOverride: definition.allowCharacterOverride }),
        tokenCount: countPromptTokens(definition.content),
        enabled: definition.enabled,
        orderIndex,
      };
    }

    if (isPresetContentSlot(key)) {
      return {
        id: createId(),
        kind: 'slot',
        slot: key,
        role: 'system',
        placement: { kind: 'relative' },
        generationTypes: [],
        enabled: true,
        orderIndex,
      };
    }

    return {
      id: createId(),
      kind: 'slot',
      slot: key,
      enabled: true,
      orderIndex,
    };
  });
}

export function restorePresetSystemPromptDefault(
  item: PresetSystemPromptItem,
): PresetSystemPromptItem {
  const definition = PRESET_SYSTEM_PROMPT_DEFAULTS[item.systemPrompt];

  const restored = {
    ...item,
    name: definition.name,
    role: definition.role,
    content: definition.content,
    placement: { ...definition.placement },
    generationTypes: [...definition.generationTypes],
    tokenCount: countPromptTokens(definition.content),
    enabled: definition.enabled,
  };

  if (definition.allowCharacterOverride === undefined) {
    const withoutOverride = { ...restored };
    delete withoutOverride.allowCharacterOverride;
    return withoutOverride;
  }
  return { ...restored, allowCharacterOverride: definition.allowCharacterOverride };
}

export function withPresetTokenCount(preset: Omit<Preset, 'tokenCount'>): Preset {
  assertValidPresetPromptModel(preset.entries, preset.promptItems);

  const entryById = new Map(preset.entries.map((entry) => [entry.id, entry]));
  const tokenCount = preset.promptItems
    .filter((item) => item.enabled)
    .reduce((total, item) => {
      if (item.kind === 'systemPrompt') {
        return total + item.tokenCount;
      }

      if (item.kind === 'customPrompt') {
        return total + entryById.get(item.entryId)!.tokenCount;
      }

      return total;
    }, 0);

  return { ...preset, tokenCount };
}

export function assertValidPresetPromptModel(
  entries: PresetEntry[],
  promptItems: PresetPromptItem[],
): void {
  const itemIds = new Set<string>();
  const systemPrompts = new Set<PresetSystemPrompt>();
  const slots = new Set<PresetSlot>();
  const entryIds = new Set<string>();
  const customReferences = new Set<string>();

  for (const entry of entries) {
    if (entryIds.has(entry.id)) {
      throw new PresetDomainError('entries.id', `Duplicate preset entry id: ${entry.id}`);
    }
    if (isReservedPresetIdentifier(entry.identifier)) {
      throw new PresetDomainError(
        'entries.identifier',
        `Preset entry uses reserved identifier: ${entry.identifier}`,
      );
    }

    entryIds.add(entry.id);
    assertPromptPlacement(entry.placement);
    assertGenerationTypes(entry.generationTypes);
  }

  for (const item of promptItems) {
    if (itemIds.has(item.id)) {
      throw new PresetDomainError('promptItems.id', `Duplicate preset prompt item id: ${item.id}`);
    }
    if (!Number.isInteger(item.orderIndex) || item.orderIndex < 0) {
      throw new PresetDomainError(
        'promptItems.orderIndex',
        `Invalid preset prompt order index: ${item.orderIndex}`,
      );
    }

    itemIds.add(item.id);

    if (item.kind === 'systemPrompt') {
      if (systemPrompts.has(item.systemPrompt)) {
        throw new PresetDomainError(
          'promptItems.systemPrompt',
          `Duplicate preset system prompt: ${item.systemPrompt}`,
        );
      }
      systemPrompts.add(item.systemPrompt);
      assertPromptPlacement(item.placement);
      assertGenerationTypes(item.generationTypes);
      assertCharacterOverrideShape(item);
      continue;
    }

    if (item.kind === 'slot') {
      if (slots.has(item.slot)) {
        throw new PresetDomainError('promptItems.slot', `Duplicate preset slot: ${item.slot}`);
      }
      slots.add(item.slot);

      if (isPresetContentSlotItem(item)) {
        assertPromptPlacement(item.placement);
        assertGenerationTypes(item.generationTypes);
      }
      continue;
    }

    if (customReferences.has(item.entryId)) {
      throw new PresetDomainError(
        'promptItems.entryId',
        `Duplicate preset custom prompt reference: ${item.entryId}`,
      );
    }
    if (!entryIds.has(item.entryId)) {
      throw new PresetDomainError(
        'promptItems.entryId',
        `Unknown preset custom prompt reference: ${item.entryId}`,
      );
    }
    customReferences.add(item.entryId);
  }

  for (const systemPrompt of PRESET_SYSTEM_PROMPTS) {
    if (!systemPrompts.has(systemPrompt)) {
      throw new PresetDomainError(
        'promptItems.systemPrompt',
        `Missing preset system prompt: ${systemPrompt}`,
      );
    }
  }
  for (const slot of PRESET_SLOTS) {
    if (!slots.has(slot)) {
      throw new PresetDomainError('promptItems.slot', `Missing preset slot: ${slot}`);
    }
  }
}

export function isPresetContentSlot(value: PresetSystemItemKey): value is PresetContentSlot {
  return (PRESET_CONTENT_SLOTS as readonly string[]).includes(value);
}

export function isPresetContentSlotItem(item: PresetSlotItem): item is PresetContentSlotItem {
  return (PRESET_CONTENT_SLOTS as readonly string[]).includes(item.slot);
}

export function isPresetSystemPrompt(value: PresetSystemItemKey): value is PresetSystemPrompt {
  return (PRESET_SYSTEM_PROMPTS as readonly string[]).includes(value);
}

export function isReservedPresetIdentifier(identifier: string): boolean {
  return (SILLY_TAVERN_RESERVED_PRESET_IDENTIFIERS as readonly string[]).includes(identifier);
}

function assertPromptPlacement(placement: PresetPromptPlacement): void {
  if (placement.kind === 'relative') {
    return;
  }

  if (
    !Number.isInteger(placement.depth) ||
    placement.depth < 0 ||
    !Number.isInteger(placement.order)
  ) {
    throw new PresetDomainError(
      'placement',
      'In-chat preset prompt placement requires an integer depth and order.',
    );
  }
}

function assertGenerationTypes(generationTypes: PresetGenerationType[]): void {
  if (new Set(generationTypes).size !== generationTypes.length) {
    throw new PresetDomainError(
      'generationTypes',
      'Preset prompt generation types must be unique.',
    );
  }
}

function assertCharacterOverrideShape(item: PresetSystemPromptItem): void {
  const supportsCharacterOverride =
    item.systemPrompt === 'mainPrompt' || item.systemPrompt === 'postHistoryInstructions';

  if (supportsCharacterOverride && item.allowCharacterOverride === undefined) {
    throw new PresetDomainError(
      'allowCharacterOverride',
      `${item.systemPrompt} requires allowCharacterOverride.`,
    );
  }
  if (!supportsCharacterOverride && item.allowCharacterOverride !== undefined) {
    throw new PresetDomainError(
      'allowCharacterOverride',
      `${item.systemPrompt} does not support allowCharacterOverride.`,
    );
  }
}
