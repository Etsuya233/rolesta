import type { DomainEvent } from '../../common/events/index.js';

export const CHARACTER_AVATAR_CHANGED = 'characters.avatar-changed';

export class CharacterAvatarChangedEvent implements DomainEvent<typeof CHARACTER_AVATAR_CHANGED> {
  readonly type = CHARACTER_AVATAR_CHANGED;
  readonly characterId: string;
  readonly ownerUserId: string;
  readonly previousResourceId: string | null;
  readonly currentResourceId: string | null;
  readonly occurredAtMs: number;

  constructor(options: {
    characterId: string;
    ownerUserId: string;
    previousResourceId: string | null;
    currentResourceId: string | null;
    occurredAtMs: number;
  }) {
    this.characterId = options.characterId;
    this.ownerUserId = options.ownerUserId;
    this.previousResourceId = options.previousResourceId;
    this.currentResourceId = options.currentResourceId;
    this.occurredAtMs = options.occurredAtMs;
  }
}
