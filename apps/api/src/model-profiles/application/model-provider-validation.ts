import {
  findModelProviderCatalogItem,
  getModelProviderSource,
  normalizeBaseUrl,
  type ModelProviderKind,
} from '../domain/model-provider-catalog.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';

export function validateProviderConnection(
  providerKind: ModelProviderKind,
  baseUrl: string,
): { providerKind: ModelProviderKind; baseUrl: string } {
  const catalogItem = findModelProviderCatalogItem(providerKind);

  if (catalogItem === null) {
    throw new ModelProviderApplicationError('invalid-provider');
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (normalizedBaseUrl.length === 0) {
    throw new ModelProviderApplicationError('invalid-base-url');
  }

  if (
    !catalogItem.allowCustomBaseUrl &&
    !catalogItem.baseUrls.some((registeredUrl) => normalizeBaseUrl(registeredUrl) === normalizedBaseUrl)
  ) {
    throw new ModelProviderApplicationError('invalid-base-url');
  }

  return { providerKind, baseUrl: normalizedBaseUrl };
}

export function sourceForProviderKind(providerKind: ModelProviderKind) {
  return getModelProviderSource(providerKind);
}
