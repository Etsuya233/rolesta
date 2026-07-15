import type { DomainEvent } from '../../common/events/index.js';

export const CHARACTER_VISIBILITY_CHANGED = 'characters.character-visibility-changed';

export class CharacterVisibilityChangedEvent implements DomainEvent<
  typeof CHARACTER_VISIBILITY_CHANGED
> {
  readonly type = CHARACTER_VISIBILITY_CHANGED;
  readonly characterId: string;
  readonly ownerUserId: string;
  readonly visibility = 'private' as const;
  readonly occurredAtMs: number;

  constructor(options: { characterId: string; ownerUserId: string; occurredAtMs: number }) {
    this.characterId = options.characterId;
    this.ownerUserId = options.ownerUserId;
    this.occurredAtMs = options.occurredAtMs;
  }
}
