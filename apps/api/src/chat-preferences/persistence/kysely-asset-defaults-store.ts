import { Injectable } from '@nestjs/common';
import type { AssetDefaultsTable } from '@rolesta/db';
import type { Insertable, Selectable, Updateable } from 'kysely';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { AssetDefaults, AssetDefaultsPatch } from '../domain/asset-defaults.js';
import { AssetDefaultsPortError } from '../ports/asset-defaults-port-error.js';
import type { AssetDefaultsStore } from '../ports/asset-defaults-store.js';

@Injectable()
export class KyselyAssetDefaultsStore implements AssetDefaultsStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async get(userId: string): Promise<AssetDefaults> {
    const row = await this.context.database
      .selectFrom('asset_defaults')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return row ? toAssetDefaults(row) : { ...emptyAssetDefaults };
  }

  async update(userId: string, patch: AssetDefaultsPatch): Promise<AssetDefaults> {
    const updates: Updateable<AssetDefaultsTable> = {};

    if (patch.personaCharacterId !== undefined) {
      updates.persona_character_id = patch.personaCharacterId;
    }
    if (patch.presetId !== undefined) {
      updates.preset_id = patch.presetId;
    }
    if (patch.modelProviderId !== undefined) {
      updates.model_provider_id = patch.modelProviderId;
    }

    const values: Insertable<AssetDefaultsTable> = {
      user_id: userId,
      persona_character_id: patch.personaCharacterId ?? null,
      preset_id: patch.presetId ?? null,
      model_provider_id: patch.modelProviderId ?? null,
    };

    try {
      await this.context.database
        .insertInto('asset_defaults')
        .values(values)
        .onConflict((conflict) => conflict.column('user_id').doUpdateSet(updates))
        .execute();
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new AssetDefaultsPortError({
          reason: 'asset-defaults-conflict',
          cause: error,
        });
      }

      throw error;
    }

    return this.get(userId);
  }

  async clearPersonaCharacter(userId: string, characterId: string): Promise<void> {
    await this.context.database
      .updateTable('asset_defaults')
      .set({ persona_character_id: null })
      .where('user_id', '=', userId)
      .where('persona_character_id', '=', characterId)
      .execute();
  }

  async clearPreset(userId: string, presetId: string): Promise<void> {
    await this.context.database
      .updateTable('asset_defaults')
      .set({ preset_id: null })
      .where('user_id', '=', userId)
      .where('preset_id', '=', presetId)
      .execute();
  }

  async clearModelProvider(userId: string, modelProviderId: string): Promise<void> {
    await this.context.database
      .updateTable('asset_defaults')
      .set({ model_provider_id: null })
      .where('user_id', '=', userId)
      .where('model_provider_id', '=', modelProviderId)
      .execute();
  }
}

const emptyAssetDefaults: AssetDefaults = {
  personaCharacterId: null,
  presetId: null,
  modelProviderId: null,
};

function toAssetDefaults(row: Selectable<AssetDefaultsTable>): AssetDefaults {
  return {
    personaCharacterId: row.persona_character_id,
    presetId: row.preset_id,
    modelProviderId: row.model_provider_id,
  };
}

function isForeignKeyConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY'
  );
}
