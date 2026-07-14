import type { DomainEvent } from '../../common/events/index.js';

export const CHARACTER_DELETED = 'characters.character-deleted';

export class CharacterDeletedEvent implements DomainEvent<typeof CHARACTER_DELETED> {
  readonly type = CHARACTER_DELETED;
  readonly characterId: string;
  readonly ownerUserId: string;
  readonly occurredAtMs: number;

  constructor(options: {
    characterId: string;
    ownerUserId: string;
    occurredAtMs: number;
  }) {
    this.characterId = options.characterId;
    this.ownerUserId = options.ownerUserId;
    this.occurredAtMs = options.occurredAtMs;
  }
}
