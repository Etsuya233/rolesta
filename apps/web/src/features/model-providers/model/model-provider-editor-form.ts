import type {
  ModelProviderCreateValues,
  ModelProviderDetailResponse,
  ModelProviderKind,
  ModelProviderSaveValues,
} from "../api/model-providers-api";

export interface ModelProviderEditorFormState {
  name: string;
  providerKind: ModelProviderKind;
  baseUrl: string;
  defaultModelName: string;
}

export const emptyModelProviderEditorForm: ModelProviderEditorFormState = {
  name: "",
  providerKind: "openai-compatible",
  baseUrl: "",
  defaultModelName: "",
};

export function modelProviderEditorFormFromDetail(
  detail: ModelProviderDetailResponse,
): ModelProviderEditorFormState {
  return {
    name: detail.name,
    providerKind: asModelProviderKind(detail.providerKind),
    baseUrl: detail.baseUrl,
    defaultModelName: detail.defaultModelName,
  };
}

export function modelProviderCreateValuesFromForm(
  form: ModelProviderEditorFormState,
): ModelProviderCreateValues {
  return {
    name: form.name,
    providerKind: form.providerKind,
    baseUrl: form.baseUrl,
    defaultModelName: form.defaultModelName,
  };
}

export function modelProviderSaveValuesFromForm(
  form: ModelProviderEditorFormState,
): ModelProviderSaveValues {
  return {
    name: form.name,
    providerKind: form.providerKind,
    baseUrl: form.baseUrl,
    defaultModelName: form.defaultModelName,
  };
}

export function asModelProviderKind(value: string): ModelProviderKind {
  if (
    value === "openai-compatible" ||
    value === "openai" ||
    value === "claude" ||
    value === "z-ai" ||
    value === "deepseek"
  ) {
    return value;
  }

  throw new Error(`Unknown model provider kind: ${value}`);
}
