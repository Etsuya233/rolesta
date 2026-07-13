import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@rolesta/db';
import type { Kysely } from 'kysely';
import { KYSELY_DB } from '../../database/database.provider.js';
import type { UserAvatarReader } from '../ports/user-avatar-reader.js';

@Injectable()
export class KyselyUserAvatarReader implements UserAvatarReader {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async avatarResourceId(userId: string): Promise<string | null> {
    const row = await this.db
      .selectFrom('users')
      .select('avatar_resource_id')
      .where('id', '=', userId)
      .executeTakeFirst();
    return row?.avatar_resource_id ?? null;
  }
}
