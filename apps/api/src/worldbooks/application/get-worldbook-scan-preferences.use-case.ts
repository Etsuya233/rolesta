import type { WorldbookScanPreferences } from '../domain/worldbook-scan-preferences.js';
import type { WorldbookScanPreferencesStore } from '../ports/worldbook-scan-preferences-store.js';

export class GetWorldbookScanPreferencesUseCase {
  constructor(private readonly store: WorldbookScanPreferencesStore) {}

  execute(userId: string): Promise<WorldbookScanPreferences> {
    return this.store.get(userId);
  }
}
