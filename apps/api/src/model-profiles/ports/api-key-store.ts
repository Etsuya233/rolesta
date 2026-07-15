import type { ApiKey } from '../domain/model-provider-config.js';

export const API_KEY_STORE = Symbol('ApiKeyStore');

export interface ApiKeyStore {
  listOwned(ownerUserId: string): Promise<ApiKey[]>;
  findOwnedById(id: string, ownerUserId: string): Promise<ApiKey | null>;
  save(apiKey: ApiKey): Promise<void>;
  update(apiKey: ApiKey): Promise<void>;
  deleteOwnedAndClearProviderReferences(
    id: string,
    ownerUserId: string,
    updatedAtMs: number,
  ): Promise<number | null>;
  countProviderReferences(id: string, ownerUserId: string): Promise<number>;
}
