import type {
  PresetDetailResponse,
  PresetDocument,
  PresetDocumentPromptItem,
  PresetEntryRole,
  PresetGenerationType,
  PresetModelSettings,
  PresetPromptItemResponse,
  PresetPromptPlacement,
  PresetVisibility,
} from '../api/presets-api';

export interface PresetEditorFormState {
  name: string;
  visibility: PresetVisibility;
  modelProviderId: string | null;
  modelSettings: PresetModelSettings;
}

export interface PresetEntryEditorFormState {
  name: string;
  role: PresetEntryRole;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  content: string;
}

export const emptyPresetModelSettings: PresetModelSettings = {
  contextLength: null,
  maxResponseLength: null,
  stream: true,
  temperature: null,
  presencePenalty: null,
  frequencyPenalty: null,
  repetitionPenalty: null,
  topP: null,
  topK: null,
  minP: null,
  topA: null,
  seed: null,
  n: null,
  reasoningEffort: '',
  verbosity: '',
  showThoughts: false,
};

export const emptyPresetEditorForm: PresetEditorFormState = {
  name: '',
  visibility: 'private',
  modelProviderId: null,
  modelSettings: emptyPresetModelSettings,
};

export const emptyPresetEntryEditorForm: PresetEntryEditorFormState = {
  name: '',
  role: 'system',
  placement: { kind: 'relative' },
  generationTypes: [],
  content: '',
};

export function presetEntryEditorFormFromEntry(
  entry: Pick<
    PresetDocument['entries'][number],
    'name' | 'role' | 'placement' | 'generationTypes' | 'content'
  >,
): PresetEntryEditorFormState {
  return {
    name: entry.name,
    role: entry.role,
    placement: entry.placement,
    generationTypes: entry.generationTypes,
    content: entry.content,
  };
}

export function presetEntryValuesFromForm(form: PresetEntryEditorFormState) {
  return {
    name: form.name.trim(),
    role: form.role,
    placement: form.placement,
    generationTypes: form.generationTypes,
    content: form.content,
  };
}

export function presetDocumentFromDetail(preset: PresetDetailResponse): PresetDocument {
  return {
    name: preset.name,
    visibility: preset.visibility,
    modelProviderId: preset.modelProviderId,
    modelSettings: preset.modelSettings,
    entries: preset.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      role: entry.role,
      placement: requestPlacement(entry.placement),
      generationTypes: entry.generationTypes,
      content: entry.content,
    })),
    promptItems: [...preset.promptItems]
      .sort((left, right) => left.orderIndex - right.orderIndex)
      .map(responsePromptItemToDocument),
  };
}

export function presetDocumentEquals(left: PresetDocument, right: PresetDocument): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function isCustomPromptItem(
  item: PresetDocumentPromptItem,
): item is PresetDocumentPromptItem & { kind: 'customPrompt'; entryId: string } {
  return item.kind === 'customPrompt';
}

export function isSystemPromptItem(
  item: PresetDocumentPromptItem,
): item is PresetDocumentPromptItem & {
  kind: 'systemPrompt';
  systemPrompt: 'mainPrompt' | 'auxiliaryPrompt' | 'enhanceDefinitions' | 'postHistoryInstructions';
  name: string;
  role: PresetEntryRole;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
  content: string;
} {
  return item.kind === 'systemPrompt';
}

export function isStructuralSlotItem(
  item: PresetDocumentPromptItem,
): item is PresetDocumentPromptItem & {
  kind: 'slot';
  slot: 'dialogueExamples' | 'chatHistory';
} {
  return item.kind === 'slot' && (item.slot === 'dialogueExamples' || item.slot === 'chatHistory');
}

export function isContentSlotItem(
  item: PresetDocumentPromptItem,
): item is PresetDocumentPromptItem & {
  kind: 'slot';
  slot:
    | 'worldInfoBefore'
    | 'personaDescription'
    | 'characterDescription'
    | 'characterPersonality'
    | 'scenario'
    | 'worldInfoAfter';
  role: PresetEntryRole;
  placement: PresetPromptPlacement;
  generationTypes: PresetGenerationType[];
} {
  return item.kind === 'slot' && !isStructuralSlotItem(item);
}

function responsePromptItemToDocument(item: PresetPromptItemResponse): PresetDocumentPromptItem {
  const base = { id: item.id, kind: item.kind, enabled: item.enabled };
  if (item.kind === 'customPrompt') {
    return { ...base, kind: item.kind, entryId: item.entryId! };
  }
  if (item.kind === 'systemPrompt') {
    const systemPrompt = item.systemPrompt!;
    const result = {
      ...base,
      kind: item.kind,
      systemPrompt,
      name: item.name!,
      role: item.role!,
      placement: requestPlacement(item.placement!),
      generationTypes: item.generationTypes!,
      content: item.content!,
    };
    return item.allowCharacterOverride === undefined
      ? result
      : { ...result, allowCharacterOverride: item.allowCharacterOverride };
  }
  const slot = item.slot! as NonNullable<PresetDocumentPromptItem['slot']>;
  if (slot === 'dialogueExamples' || slot === 'chatHistory') {
    return { ...base, kind: item.kind, slot };
  }
  return {
    ...base,
    kind: item.kind,
    slot,
    role: item.role!,
    placement: requestPlacement(item.placement!),
    generationTypes: item.generationTypes!,
  };
}

function requestPlacement(input: {
  kind: 'relative' | 'inChat';
  depth?: number | null;
  order?: number | null;
}): PresetPromptPlacement {
  return input.kind === 'relative'
    ? { kind: 'relative' }
    : { kind: 'inChat', depth: input.depth!, order: input.order! };
}
