import type {
  PresetDetailResponse,
  PresetDocument,
  PresetEntryPosition,
  PresetEntryRole,
  PresetModelSettings,
  PresetVisibility,
} from "../api/presets-api";

export interface PresetEditorFormState {
  name: string;
  visibility: PresetVisibility;
  modelProviderId: string | null;
  modelSettings: PresetModelSettings;
}

export interface PresetEntryEditorFormState {
  name: string;
  role: PresetEntryRole;
  position: PresetEntryPosition;
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
  reasoningEffort: "",
  verbosity: "",
  showThoughts: false,
};

export const emptyPresetEditorForm: PresetEditorFormState = {
  name: "",
  visibility: "private",
  modelProviderId: null,
  modelSettings: emptyPresetModelSettings,
};

export const emptyPresetEntryEditorForm: PresetEntryEditorFormState = {
  name: "",
  role: "system",
  position: "system",
  content: "",
};

export function presetEntryEditorFormFromEntry(
  entry: Pick<
    PresetDocument["entries"][number],
    "name" | "role" | "position" | "content"
  >,
): PresetEntryEditorFormState {
  return {
    name: entry.name,
    role: entry.role,
    position: entry.position,
    content: entry.content,
  };
}

export function presetEntryValuesFromForm(form: PresetEntryEditorFormState) {
  return {
    name: form.name.trim(),
    role: form.role,
    position: form.position,
    content: form.content,
  };
}

export function presetDocumentFromDetail(
  preset: PresetDetailResponse,
): PresetDocument {
  return {
    name: preset.name,
    visibility: preset.visibility,
    modelProviderId: preset.modelProviderId,
    modelSettings: preset.modelSettings,
    entries: preset.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      role: entry.role,
      position: entry.position,
      content: entry.content,
    })),
    promptItems: [...preset.promptItems]
      .sort((left, right) => left.orderIndex - right.orderIndex)
      .map((item) => ({
        entryId: item.entryId,
        enabled: item.enabled,
      })),
  };
}

export function presetDocumentEquals(
  left: PresetDocument,
  right: PresetDocument,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
