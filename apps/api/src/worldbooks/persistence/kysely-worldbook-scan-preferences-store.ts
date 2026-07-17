import { Injectable } from '@nestjs/common';
import type { Insertable, Selectable } from 'kysely';
import type { WorldbookScanPreferencesTable } from '@rolesta/db';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import {
  DEFAULT_WORLDBOOK_SCAN_PREFERENCES,
  type WorldbookScanPreferences,
} from '../domain/worldbook-scan-preferences.js';
import type { WorldbookScanPreferencesStore } from '../ports/worldbook-scan-preferences-store.js';

@Injectable()
export class KyselyWorldbookScanPreferencesStore implements WorldbookScanPreferencesStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async get(userId: string): Promise<WorldbookScanPreferences> {
    const row = await this.context.database
      .selectFrom('worldbook_scan_preferences')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return row ? toPreferences(row) : { ...DEFAULT_WORLDBOOK_SCAN_PREFERENCES };
  }

  async save(userId: string, preferences: WorldbookScanPreferences): Promise<void> {
    const row = toRow(userId, preferences);
    await this.context.database
      .insertInto('worldbook_scan_preferences')
      .values(row)
      .onConflict((conflict) => conflict.column('user_id').doUpdateSet(row))
      .execute();
  }
}

type PreferencesRow = Selectable<WorldbookScanPreferencesTable>;

function toPreferences(row: PreferencesRow): WorldbookScanPreferences {
  return {
    scanDepth: row.scan_depth,
    minActivations: row.min_activations,
    minActivationsDepthMax: row.min_activations_depth_max,
    budgetPercent: row.budget_percent,
    budgetCap: row.budget_cap,
    recursive: row.recursive === 1,
    caseSensitive: row.case_sensitive === 1,
    matchWholeWords: row.match_whole_words === 1,
    useGroupScoring: row.use_group_scoring === 1,
    maxRecursionSteps: row.max_recursion_steps,
    includeNames: row.include_names === 1,
    characterLoreInsertionStrategy: row.character_lore_insertion_strategy,
  };
}

function toRow(
  userId: string,
  preferences: WorldbookScanPreferences,
): Insertable<WorldbookScanPreferencesTable> {
  return {
    user_id: userId,
    scan_depth: preferences.scanDepth,
    min_activations: preferences.minActivations,
    min_activations_depth_max: preferences.minActivationsDepthMax,
    budget_percent: preferences.budgetPercent,
    budget_cap: preferences.budgetCap,
    recursive: preferences.recursive ? 1 : 0,
    case_sensitive: preferences.caseSensitive ? 1 : 0,
    match_whole_words: preferences.matchWholeWords ? 1 : 0,
    use_group_scoring: preferences.useGroupScoring ? 1 : 0,
    max_recursion_steps: preferences.maxRecursionSteps,
    include_names: preferences.includeNames ? 1 : 0,
    character_lore_insertion_strategy: preferences.characterLoreInsertionStrategy,
  };
}
