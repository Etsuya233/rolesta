import { Injectable } from '@nestjs/common';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { UserAvatarReader } from '../ports/user-avatar-reader.js';

@Injectable()
export class KyselyUserAvatarReader implements UserAvatarReader {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async avatarResourceId(userId: string): Promise<string | null> {
    const row = await this.context.database
      .selectFrom('users')
      .select('avatar_resource_id')
      .where('id', '=', userId)
      .executeTakeFirst();
    return row?.avatar_resource_id ?? null;
  }
}
