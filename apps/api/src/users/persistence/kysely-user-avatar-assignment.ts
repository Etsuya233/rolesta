import { Injectable } from '@nestjs/common';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { UserAvatarAssignment } from '../ports/user-avatar-assignment.js';
import { UserAvatarPortError } from '../ports/user-avatar-port-error.js';

@Injectable()
export class KyselyUserAvatarAssignment implements UserAvatarAssignment {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async replace(input: {
    userId: string;
    resourceId: string;
    nowMs: number;
  }): Promise<boolean> {
    const database = this.context.database;
    const current = await database
      .selectFrom('users')
      .select(['id', 'avatar_resource_id'])
      .where('id', '=', input.userId)
      .executeTakeFirst();

    if (!current) {
      return false;
    }

    if (current.avatar_resource_id === input.resourceId) {
      return true;
    }

    const activated = await database
      .updateTable('file_resources')
      .set({ status: 'active', orphaned_at_ms: null })
      .where('id', '=', input.resourceId)
      .where('owner_user_id', '=', input.userId)
      .where('purpose', '=', 'user-avatar')
      .where('status', '=', 'pending')
      .executeTakeFirst();

    if (Number(activated.numUpdatedRows) !== 1) {
      throw new UserAvatarPortError({
        reason: 'invalid-avatar',
        params: {
          field: 'resourceId',
          detail: 'Avatar resource is not assignable.',
        },
      });
    }

    let update = database
      .updateTable('users')
      .set({
        avatar_resource_id: input.resourceId,
        updated_at: new Date(input.nowMs).toISOString(),
      })
      .where('id', '=', input.userId);
    update =
      current.avatar_resource_id === null
        ? update.where('avatar_resource_id', 'is', null)
        : update.where('avatar_resource_id', '=', current.avatar_resource_id);
    const updated = await update.executeTakeFirst();

    if (Number(updated.numUpdatedRows) !== 1) {
      throw avatarAssignmentConflict();
    }

    if (current.avatar_resource_id) {
      const orphaned = await database
        .updateTable('file_resources')
        .set({ status: 'orphaned', orphaned_at_ms: input.nowMs })
        .where('id', '=', current.avatar_resource_id)
        .where('owner_user_id', '=', input.userId)
        .where('purpose', '=', 'user-avatar')
        .where('status', '=', 'active')
        .executeTakeFirst();

      if (Number(orphaned.numUpdatedRows) !== 1) {
        throw avatarAssignmentConflict();
      }
    }

    return true;
  }

  async remove(input: { userId: string; nowMs: number }): Promise<boolean> {
    const database = this.context.database;
    const current = await database
      .selectFrom('users')
      .select(['id', 'avatar_resource_id'])
      .where('id', '=', input.userId)
      .executeTakeFirst();

    if (!current) {
      return false;
    }

    if (current.avatar_resource_id === null) {
      return true;
    }

    const updated = await database
      .updateTable('users')
      .set({
        avatar_resource_id: null,
        updated_at: new Date(input.nowMs).toISOString(),
      })
      .where('id', '=', input.userId)
      .where('avatar_resource_id', '=', current.avatar_resource_id)
      .executeTakeFirst();

    if (Number(updated.numUpdatedRows) !== 1) {
      throw avatarAssignmentConflict();
    }

    const orphaned = await database
      .updateTable('file_resources')
      .set({ status: 'orphaned', orphaned_at_ms: input.nowMs })
      .where('id', '=', current.avatar_resource_id)
      .where('owner_user_id', '=', input.userId)
      .where('purpose', '=', 'user-avatar')
      .where('status', '=', 'active')
      .executeTakeFirst();

    if (Number(orphaned.numUpdatedRows) !== 1) {
      throw avatarAssignmentConflict();
    }

    return true;
  }
}

function avatarAssignmentConflict(): UserAvatarPortError<'avatar-assignment-conflict'> {
  return new UserAvatarPortError({
    reason: 'avatar-assignment-conflict',
    params: { detail: 'User avatar changed concurrently.' },
  });
}
