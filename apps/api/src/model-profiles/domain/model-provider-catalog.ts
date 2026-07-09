import { ModelProviderDomainError } from './model-provider-domain-error.js';

export const MODEL_PROVIDER_KINDS = [
  'openai-compatible',
  'openai',
  'claude',
  'z-ai',
  'deepseek',
] as const;
export type ModelProviderKind = (typeof MODEL_PROVIDER_KINDS)[number];

export const MODEL_PROVIDER_SOURCES = ['custom', 'official'] as const;
export type ModelProviderSource = (typeof MODEL_PROVIDER_SOURCES)[number];

export interface ModelProviderCatalogItem {
  kind: ModelProviderKind;
  source: ModelProviderSource;
  displayName: string;
  baseUrls: string[];
  allowCustomBaseUrl: boolean;
}

export const MODEL_PROVIDER_CATALOG = [
  {
    kind: 'openai-compatible',
    source: 'custom',
    displayName: 'OpenAI Compatible',
    baseUrls: [],
    allowCustomBaseUrl: true,
  },
  {
    kind: 'openai',
    source: 'official',
    displayName: 'OpenAI',
    baseUrls: ['https://api.openai.com/v1'],
    allowCustomBaseUrl: false,
  },
  {
    kind: 'claude',
    source: 'official',
    displayName: 'Claude',
    baseUrls: ['https://api.anthropic.com/v1'],
    allowCustomBaseUrl: false,
  },
  {
    kind: 'z-ai',
    source: 'official',
    displayName: 'Z.AI',
    baseUrls: ['https://api.z.ai/api/paas/v4', 'https://api.z.ai/api/coding/paas/v4'],
    allowCustomBaseUrl: false,
  },
  {
    kind: 'deepseek',
    source: 'official',
    displayName: 'DeepSeek',
    baseUrls: ['https://api.deepseek.com'],
    allowCustomBaseUrl: false,
  },
] as const satisfies ModelProviderCatalogItem[];

export function findModelProviderCatalogItem(
  kind: ModelProviderKind,
): ModelProviderCatalogItem | null {
  return MODEL_PROVIDER_CATALOG.find((item) => item.kind === kind) ?? null;
}

export function getModelProviderSource(kind: ModelProviderKind): ModelProviderSource {
  const catalogItem = findModelProviderCatalogItem(kind);

  if (catalogItem === null) {
    throw new ModelProviderDomainError('invalid-provider', { providerKind: kind });
  }

  return catalogItem.source;
}
