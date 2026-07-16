import type { WorldbookScanPreferences } from '../domain/worldbook-scan-preferences.js';
import type { WorldbookScanPreferencesStore } from '../ports/worldbook-scan-preferences-store.js';

export class UpdateWorldbookScanPreferencesUseCase {
  constructor(private readonly store: WorldbookScanPreferencesStore) {}

  async execute(
    userId: string,
    preferences: WorldbookScanPreferences,
  ): Promise<WorldbookScanPreferences> {
    await this.store.save(userId, preferences);
    return preferences;
  }
}
