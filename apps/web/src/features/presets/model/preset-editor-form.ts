import type {
  PresetDetailResponse,
  PresetEntryPosition,
  PresetEntryResponse,
  PresetEntryRole,
  PresetModelSettings,
} from "../api/presets-api";

export interface PresetEditorFormState {
  name: string;
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
  modelSettings: emptyPresetModelSettings,
};

export const emptyPresetEntryEditorForm: PresetEntryEditorFormState = {
  name: "",
  role: "system",
  position: "system",
  content: "",
};

export function presetEditorFormFromDetail(
  preset: PresetDetailResponse,
): PresetEditorFormState {
  return {
    name: preset.name,
    modelSettings: preset.modelSettings,
  };
}

export function presetEntryEditorFormFromEntry(
  entry: PresetEntryResponse,
): PresetEntryEditorFormState {
  return {
    name: entry.name,
    role: entry.role,
    position: entry.position,
    content: entry.content,
  };
}

export function presetValuesFromForm(form: PresetEditorFormState) {
  return {
    name: form.name.trim(),
    modelSettings: form.modelSettings,
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
