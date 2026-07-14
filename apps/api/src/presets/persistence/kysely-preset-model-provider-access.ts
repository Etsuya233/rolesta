import { Inject, Injectable } from '@nestjs/common';
import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { PresetModelProviderAccess } from '../ports/preset-model-provider-access.js';

@Injectable()
export class KyselyPresetModelProviderAccess implements PresetModelProviderAccess {
  constructor(
    private readonly context: KyselyDatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async acquireOwned(
    modelProviderId: string,
    ownerUserId: string,
  ): Promise<boolean> {
    let query = this.context.database
      .selectFrom('model_provider_configs')
      .select('id')
      .where('id', '=', modelProviderId)
      .where('owner_user_id', '=', ownerUserId);

    if (this.config.database.dialect !== 'sqlite') {
      query = query.forUpdate();
    }

    return (await query.executeTakeFirst()) !== undefined;
  }
}
