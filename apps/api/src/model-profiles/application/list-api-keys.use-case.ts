import type { ApiKey } from '../domain/model-provider-config.js';
import type { ApiKeyStore } from '../ports/api-key-store.js';

export class ListApiKeysUseCase {
  constructor(private readonly store: ApiKeyStore) {}
  execute(ownerUserId: string): Promise<ApiKey[]> {
    return this.store.listOwned(ownerUserId);
  }
}
