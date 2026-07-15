import {
  findModelProviderCatalogItem,
  getModelProviderSource,
  type ModelProviderKind,
} from './model-provider-catalog.js';
import { ModelProviderDomainError } from './model-provider-domain-error.js';

export function validateProviderConnection(
  providerKind: ModelProviderKind,
  baseUrl: string,
): { providerKind: ModelProviderKind; baseUrl: string } {
  const catalogItem = findModelProviderCatalogItem(providerKind);

  if (catalogItem === null) {
    throw new ModelProviderDomainError('invalid-provider', { providerKind });
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (normalizedBaseUrl.length === 0) {
    throw new ModelProviderDomainError('invalid-base-url', { providerKind, baseUrl });
  }

  if (
    !catalogItem.allowCustomBaseUrl &&
    !catalogItem.baseUrls.some(
      (registeredUrl) => normalizeBaseUrl(registeredUrl) === normalizedBaseUrl,
    )
  ) {
    throw new ModelProviderDomainError('invalid-base-url', { providerKind, baseUrl });
  }

  return { providerKind, baseUrl: normalizedBaseUrl };
}

export function sourceForProviderKind(providerKind: ModelProviderKind) {
  return getModelProviderSource(providerKind);
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/u, '');
}
