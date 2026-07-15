import type { ModelProviderKind, ModelProviderSource } from './model-provider-catalog.js';

export interface ModelProviderConfig {
  id: string;
  ownerUserId: string;
  name: string;
  providerKind: ModelProviderKind;
  providerSource: ModelProviderSource;
  baseUrl: string;
  defaultModelName: string;
  credentialMode: ModelProviderCredentialMode;
  secret: string;
  apiKeyId: string | null;
  apiKeyName: string | null;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface ModelProviderSummary {
  id: string;
  ownerUserId: string;
  name: string;
  providerKind: ModelProviderKind;
  providerSource: ModelProviderSource;
  baseUrl: string;
  defaultModelName: string;
  credentialMode: ModelProviderCredentialMode;
  apiKeyId: string | null;
  apiKeyName: string | null;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export type ModelProviderCredentialMode = 'manual' | 'vault';

export interface ApiKey {
  id: string;
  ownerUserId: string;
  name: string;
  secret: string;
  createdAtMs: number;
  updatedAtMs: number;
}
