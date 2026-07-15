import type { AssetDefaults } from '../domain/asset-defaults.js';
import type { AssetDefaultsStore } from '../ports/asset-defaults-store.js';

export class GetAssetDefaultsUseCase {
  constructor(private readonly store: AssetDefaultsStore) {}

  execute(userId: string): Promise<AssetDefaults> {
    return this.store.get(userId);
  }
}
