import type { WorldbookScanPreferences } from '../domain/worldbook-scan-preferences.js';

export const WORLDBOOK_SCAN_PREFERENCES_STORE = Symbol('WorldbookScanPreferencesStore');

export interface WorldbookScanPreferencesStore {
  get(userId: string): Promise<WorldbookScanPreferences>;
  save(userId: string, preferences: WorldbookScanPreferences): Promise<void>;
}
