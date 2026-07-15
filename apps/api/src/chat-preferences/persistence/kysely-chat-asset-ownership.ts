import { Injectable } from '@nestjs/common';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { AssetDefaultField, AssetDefaultsPatch } from '../domain/asset-defaults.js';
import type { ChatAssetOwnership } from '../ports/chat-asset-ownership.js';

@Injectable()
export class KyselyChatAssetOwnership implements ChatAssetOwnership {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async findUnavailableFields(
    userId: string,
    patch: AssetDefaultsPatch,
  ): Promise<AssetDefaultField[]> {
    const checks: Array<Promise<AssetDefaultField | null>> = [];

    if (patch.personaCharacterId !== undefined && patch.personaCharacterId !== null) {
      checks.push(
        this.context.database
          .selectFrom('characters')
          .select('id')
          .where('id', '=', patch.personaCharacterId)
          .where('owner_user_id', '=', userId)
          .executeTakeFirst()
          .then((row) => (row ? null : 'personaCharacterId')),
      );
    }

    if (patch.presetId !== undefined && patch.presetId !== null) {
      checks.push(
        this.context.database
          .selectFrom('presets')
          .select('id')
          .where('id', '=', patch.presetId)
          .where('owner_user_id', '=', userId)
          .executeTakeFirst()
          .then((row) => (row ? null : 'presetId')),
      );
    }

    if (patch.modelProviderId !== undefined && patch.modelProviderId !== null) {
      checks.push(
        this.context.database
          .selectFrom('model_provider_configs')
          .select('id')
          .where('id', '=', patch.modelProviderId)
          .where('owner_user_id', '=', userId)
          .executeTakeFirst()
          .then((row) => (row ? null : 'modelProviderId')),
      );
    }

    return (await Promise.all(checks)).filter(
      (field): field is AssetDefaultField => field !== null,
    );
  }
}
