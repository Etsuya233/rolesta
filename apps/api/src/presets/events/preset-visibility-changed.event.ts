import type { DomainEvent } from "../../common/events/index.js";

export const PRESET_VISIBILITY_CHANGED = "presets.preset-visibility-changed";

export class PresetVisibilityChangedEvent implements DomainEvent<
  typeof PRESET_VISIBILITY_CHANGED
> {
  readonly type = PRESET_VISIBILITY_CHANGED;
  readonly presetId: string;
  readonly ownerUserId: string;
  readonly visibility = "private" as const;
  readonly occurredAtMs: number;

  constructor(options: {
    presetId: string;
    ownerUserId: string;
    occurredAtMs: number;
  }) {
    this.presetId = options.presetId;
    this.ownerUserId = options.ownerUserId;
    this.occurredAtMs = options.occurredAtMs;
  }
}
