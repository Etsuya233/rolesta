import type {
  ModelProviderCreateValues,
  ModelProviderDetailResponse,
  ModelProviderKind,
  ModelProviderSaveValues,
} from '../api/model-providers-api';

export interface ModelProviderEditorFormState {
  name: string;
  providerKind: ModelProviderKind;
  baseUrl: string;
  defaultModelName: string;
  credentialMode: 'manual' | 'vault';
  secret: string;
  apiKeyId: string | null;
  apiKeyName: string | null;
}

export const emptyModelProviderEditorForm: ModelProviderEditorFormState = {
  name: '',
  providerKind: 'openai-compatible',
  baseUrl: '',
  defaultModelName: '',
  credentialMode: 'manual',
  secret: '',
  apiKeyId: null,
  apiKeyName: null,
};

export function modelProviderEditorFormFromDetail(
  detail: ModelProviderDetailResponse,
): ModelProviderEditorFormState {
  return {
    name: detail.name,
    providerKind: asModelProviderKind(detail.providerKind),
    baseUrl: detail.baseUrl,
    defaultModelName: detail.defaultModelName,
    credentialMode: detail.credentialMode,
    secret: detail.secret,
    apiKeyId: detail.apiKeyId,
    apiKeyName: detail.apiKeyName,
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
    credentialMode: form.credentialMode,
    secret: form.credentialMode === 'manual' ? form.secret : '',
    apiKeyId: form.credentialMode === 'vault' ? form.apiKeyId : null,
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
    credentialMode: form.credentialMode,
    secret: form.credentialMode === 'manual' ? form.secret : '',
    apiKeyId: form.credentialMode === 'vault' ? form.apiKeyId : null,
  };
}

export function asModelProviderKind(value: string): ModelProviderKind {
  if (
    value === 'openai-compatible' ||
    value === 'openai' ||
    value === 'claude' ||
    value === 'z-ai' ||
    value === 'deepseek'
  ) {
    return value;
  }

  throw new Error(`Unknown model provider kind: ${value}`);
}
