import type { ModelProviderConfig } from '../domain/model-provider-config.js';
import type { ApiKeyStore } from '../ports/api-key-store.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';

export async function modelProviderSecret(
  config: ModelProviderConfig,
  apiKeyStore: ApiKeyStore,
): Promise<string | undefined> {
  if (config.credentialMode === 'manual') return config.secret || undefined;
  const apiKey = config.apiKeyId
    ? await apiKeyStore.findOwnedById(config.apiKeyId, config.ownerUserId)
    : null;
  if (!apiKey) throw new ModelProviderApplicationError('api-key-not-owned', {});
  return apiKey.secret;
}

export async function apiKeySecret(
  apiKeyId: string,
  ownerUserId: string,
  apiKeyStore: ApiKeyStore,
): Promise<string> {
  const apiKey = await apiKeyStore.findOwnedById(apiKeyId, ownerUserId);

  if (!apiKey) {
    throw new ModelProviderApplicationError('api-key-not-owned', {});
  }

  return apiKey.secret;
}
