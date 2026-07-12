import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@rolesta/db';
import type { Kysely } from 'kysely';
import { KYSELY_DB } from '../../database/database.provider.js';
import type { UserAvatarStore } from '../ports/user-avatar-store.js';

@Injectable()
export class KyselyUserAvatarStore implements UserAvatarStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async replaceAvatar(userId: string, avatarResourceId: string | null, now: string, nowMs: number): Promise<boolean> {
    return this.db.transaction().execute(async (transaction) => {
      const user = await transaction.selectFrom('users').select(['id', 'avatar_resource_id']).where('id', '=', userId).executeTakeFirst();
      if (!user) return false;
      if (avatarResourceId) {
        await transaction.updateTable('file_resources').set({ status: 'active', orphaned_at_ms: null }).where('id', '=', avatarResourceId).where('owner_user_id', '=', userId).execute();
      }
      if (user.avatar_resource_id) {
        await transaction.updateTable('file_resources').set({ status: 'orphaned', orphaned_at_ms: nowMs }).where('id', '=', user.avatar_resource_id).execute();
      }
      await transaction.updateTable('users').set({ avatar_resource_id: avatarResourceId, updated_at: now }).where('id', '=', userId).execute();
      return true;
    });
  }

  async avatarResourceId(userId: string): Promise<string | null> {
    const row = await this.db.selectFrom('users').select('avatar_resource_id').where('id', '=', userId).executeTakeFirst();
    return row?.avatar_resource_id ?? null;
  }
}
