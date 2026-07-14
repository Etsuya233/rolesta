import type { DomainEvent } from "../../common/events/index.js";

export const MODEL_PROVIDER_DELETED = "model-profiles.model-provider-deleted";

export class ModelProviderDeletedEvent implements DomainEvent<
  typeof MODEL_PROVIDER_DELETED
> {
  readonly type = MODEL_PROVIDER_DELETED;
  readonly modelProviderId: string;
  readonly ownerUserId: string;
  readonly occurredAtMs: number;

  constructor(options: {
    modelProviderId: string;
    ownerUserId: string;
    occurredAtMs: number;
  }) {
    this.modelProviderId = options.modelProviderId;
    this.ownerUserId = options.ownerUserId;
    this.occurredAtMs = options.occurredAtMs;
  }
}
