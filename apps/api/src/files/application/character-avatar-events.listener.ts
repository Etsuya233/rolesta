import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CHARACTER_AVATAR_CHANGED,
  CHARACTER_DELETED,
  type CharacterAvatarChangedEvent,
  type CharacterDeletedEvent,
} from '../../characters/events/index.js';
import { FILE_METADATA_STORE, type FileMetadataStore } from '../ports/file-metadata-store.js';
import { FilePortError } from '../ports/file-port-error.js';

@Injectable()
export class CharacterAvatarEventsListener {
  constructor(@Inject(FILE_METADATA_STORE) private readonly metadata: FileMetadataStore) {}

  @OnEvent(CHARACTER_AVATAR_CHANGED, { suppressErrors: false })
  async onCharacterAvatarChanged(event: CharacterAvatarChangedEvent): Promise<void> {
    if (event.currentResourceId) {
      const activated = await this.metadata.activatePendingCharacterAvatar(
        event.currentResourceId,
        event.ownerUserId,
      );
      if (!activated) {
        throw new FilePortError({
          reason: 'resource-state-conflict',
          params: {
            resourceId: event.currentResourceId,
            expectedStatus: 'pending',
          },
        });
      }
    }

    if (event.previousResourceId) {
      await this.orphanAvatar(event.previousResourceId, event.ownerUserId, event.occurredAtMs);
    }
  }

  @OnEvent(CHARACTER_DELETED, { suppressErrors: false })
  async onCharacterDeleted(event: CharacterDeletedEvent): Promise<void> {
    if (event.avatarResourceId) {
      await this.orphanAvatar(event.avatarResourceId, event.ownerUserId, event.occurredAtMs);
    }
  }

  private async orphanAvatar(
    resourceId: string,
    ownerUserId: string,
    orphanedAtMs: number,
  ): Promise<void> {
    const orphaned = await this.metadata.orphanActiveCharacterAvatar(
      resourceId,
      ownerUserId,
      orphanedAtMs,
    );
    if (!orphaned) {
      throw new FilePortError({
        reason: 'resource-state-conflict',
        params: { resourceId, expectedStatus: 'active' },
      });
    }
  }
}
