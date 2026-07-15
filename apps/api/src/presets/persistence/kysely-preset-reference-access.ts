import { Inject, Injectable } from '@nestjs/common';
import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { PresetReferenceAccess } from '../contracts/preset-reference-access.js';

@Injectable()
export class KyselyPresetReferenceAccess implements PresetReferenceAccess {
  constructor(
    private readonly context: KyselyDatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async acquireVisible(presetId: string, viewerUserId: string): Promise<boolean> {
    let query = this.context.database
      .selectFrom('presets')
      .select('id')
      .where('id', '=', presetId)
      .where((builder) =>
        builder.or([
          builder('owner_user_id', '=', viewerUserId),
          builder('visibility', '=', 'public'),
        ]),
      );
    if (this.config.database.dialect !== 'sqlite') query = query.forUpdate();
    return (await query.executeTakeFirst()) !== undefined;
  }
}
