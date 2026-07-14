import type { DomainEvent } from '../../common/events/index.js';

export const PRESET_DELETED = 'presets.preset-deleted';

export class PresetDeletedEvent implements DomainEvent<typeof PRESET_DELETED> {
  readonly type = PRESET_DELETED;
  readonly presetId: string;
  readonly ownerUserId: string;
  readonly occurredAtMs: number;

  constructor(options: { presetId: string; ownerUserId: string; occurredAtMs: number }) {
    this.presetId = options.presetId;
    this.ownerUserId = options.ownerUserId;
    this.occurredAtMs = options.occurredAtMs;
  }
}
