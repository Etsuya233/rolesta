import type { ModelProviderKind, ModelProviderSource } from './model-provider-catalog.js';

export interface ModelProviderConfig {
  id: string;
  ownerUserId: string;
  name: string;
  providerKind: ModelProviderKind;
  providerSource: ModelProviderSource;
  baseUrl: string;
  defaultModelName: string;
  selectedApiKeyId: string | null;
  apiKeys: ModelProviderApiKey[];
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
  selectedApiKeyId: string | null;
  apiKeyCount: number;
  createdAtMs: number;
  updatedAtMs: number;
  lastUsedAtMs: number | null;
  usageCount: number;
}

export interface ModelProviderApiKey {
  id: string;
  configId: string;
  name: string;
  secret: string;
  createdAtMs: number;
  updatedAtMs: number;
}
