import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@rolesta/db';
import type { Kysely } from 'kysely';
import { KYSELY_DB } from '../../database/database.provider.js';
import type { CharacterCard } from '../domain/character-card.js';
import type { CharacterAvatarAssignment } from '../ports/character-avatar-assignment.js';
import { CharacterPortError } from '../ports/character-port-error.js';
import { toCharacterCard } from './character-card-row-mapper.js';

@Injectable()
export class KyselyCharacterAvatarAssignment implements CharacterAvatarAssignment {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async replace(input: {
    characterId: string;
    ownerUserId: string;
    resourceId: string;
    nowMs: number;
  }): Promise<CharacterCard | null> {
    return this.db.transaction().execute(async (transaction) => {
      const current = await transaction
        .selectFrom('characters')
        .selectAll()
        .where('id', '=', input.characterId)
        .where('owner_user_id', '=', input.ownerUserId)
        .executeTakeFirst();

      if (!current) {
        return null;
      }

      if (current.avatar_resource_id === input.resourceId) {
        return toCharacterCard(current);
      }

      const activated = await transaction
        .updateTable('file_resources')
        .set({ status: 'active', orphaned_at_ms: null })
        .where('id', '=', input.resourceId)
        .where('owner_user_id', '=', input.ownerUserId)
        .where('purpose', '=', 'character-avatar')
        .where('status', '=', 'pending')
        .executeTakeFirst();

      if (Number(activated.numUpdatedRows) !== 1) {
        throw new CharacterPortError({
          reason: 'invalid-avatar',
          params: {
            field: 'resourceId',
            detail: 'Avatar resource is not assignable.',
          },
        });
      }

      let update = transaction
        .updateTable('characters')
        .set({
          avatar_resource_id: input.resourceId,
          updated_at_ms: input.nowMs,
        })
        .where('id', '=', input.characterId)
        .where('owner_user_id', '=', input.ownerUserId);
      update =
        current.avatar_resource_id === null
          ? update.where('avatar_resource_id', 'is', null)
          : update.where('avatar_resource_id', '=', current.avatar_resource_id);
      const updated = await update.returningAll().executeTakeFirst();

      if (!updated) {
        throw avatarAssignmentConflict();
      }

      if (current.avatar_resource_id) {
        const orphaned = await transaction
          .updateTable('file_resources')
          .set({ status: 'orphaned', orphaned_at_ms: input.nowMs })
          .where('id', '=', current.avatar_resource_id)
          .where('owner_user_id', '=', input.ownerUserId)
          .where('purpose', '=', 'character-avatar')
          .where('status', '=', 'active')
          .executeTakeFirst();

        if (Number(orphaned.numUpdatedRows) !== 1) {
          throw avatarAssignmentConflict();
        }
      }

      return toCharacterCard(updated);
    });
  }

  async remove(input: { characterId: string; ownerUserId: string; nowMs: number }): Promise<CharacterCard | null> {
    return this.db.transaction().execute(async (transaction) => {
      const current = await transaction
        .selectFrom('characters')
        .selectAll()
        .where('id', '=', input.characterId)
        .where('owner_user_id', '=', input.ownerUserId)
        .executeTakeFirst();

      if (!current) {
        return null;
      }

      if (current.avatar_resource_id === null) {
        return toCharacterCard(current);
      }

      const updated = await transaction
        .updateTable('characters')
        .set({ avatar_resource_id: null, updated_at_ms: input.nowMs })
        .where('id', '=', input.characterId)
        .where('owner_user_id', '=', input.ownerUserId)
        .where('avatar_resource_id', '=', current.avatar_resource_id)
        .returningAll()
        .executeTakeFirst();

      if (!updated) {
        throw avatarAssignmentConflict();
      }

      const orphaned = await transaction
        .updateTable('file_resources')
        .set({ status: 'orphaned', orphaned_at_ms: input.nowMs })
        .where('id', '=', current.avatar_resource_id)
        .where('owner_user_id', '=', input.ownerUserId)
        .where('purpose', '=', 'character-avatar')
        .where('status', '=', 'active')
        .executeTakeFirst();

      if (Number(orphaned.numUpdatedRows) !== 1) {
        throw avatarAssignmentConflict();
      }

      return toCharacterCard(updated);
    });
  }
}

function avatarAssignmentConflict(): CharacterPortError<'avatar-assignment-conflict'> {
  return new CharacterPortError({
    reason: 'avatar-assignment-conflict',
    params: { detail: 'Character avatar changed concurrently.' },
  });
}
