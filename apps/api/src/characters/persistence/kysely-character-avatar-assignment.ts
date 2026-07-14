import { Injectable } from '@nestjs/common';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type {
  CharacterAvatarAssignment,
  CharacterAvatarAssignmentResult,
} from '../ports/character-avatar-assignment.js';
import { CharacterPortError } from '../ports/character-port-error.js';
import { toCharacterCard } from './character-card-row-mapper.js';

@Injectable()
export class KyselyCharacterAvatarAssignment implements CharacterAvatarAssignment {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async replace(input: {
    characterId: string;
    ownerUserId: string;
    resourceId: string;
    nowMs: number;
  }): Promise<CharacterAvatarAssignmentResult | null> {
    const database = this.context.database;
    const current = await database
      .selectFrom('characters')
      .selectAll()
      .where('id', '=', input.characterId)
      .where('owner_user_id', '=', input.ownerUserId)
      .executeTakeFirst();

    if (!current) {
      return null;
    }

    if (current.avatar_resource_id === input.resourceId) {
      return {
        character: toCharacterCard(current),
        previousResourceId: current.avatar_resource_id,
      };
    }

    let update = database
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

    return {
      character: toCharacterCard(updated),
      previousResourceId: current.avatar_resource_id,
    };
  }

  async remove(input: {
    characterId: string;
    ownerUserId: string;
    nowMs: number;
  }): Promise<CharacterAvatarAssignmentResult | null> {
    const database = this.context.database;
    const current = await database
      .selectFrom('characters')
      .selectAll()
      .where('id', '=', input.characterId)
      .where('owner_user_id', '=', input.ownerUserId)
      .executeTakeFirst();

    if (!current) {
      return null;
    }

    if (current.avatar_resource_id === null) {
      return {
        character: toCharacterCard(current),
        previousResourceId: null,
      };
    }

    const updated = await database
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

    return {
      character: toCharacterCard(updated),
      previousResourceId: current.avatar_resource_id,
    };
  }
}

function avatarAssignmentConflict(): CharacterPortError<'avatar-assignment-conflict'> {
  return new CharacterPortError({
    reason: 'avatar-assignment-conflict',
    params: { detail: 'Character avatar changed concurrently.' },
  });
}
