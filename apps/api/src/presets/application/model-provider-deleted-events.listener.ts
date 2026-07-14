import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  MODEL_PROVIDER_DELETED,
  type ModelProviderDeletedEvent,
} from '../../model-profiles/events/index.js';
import { PRESET_STORE, type PresetStore } from '../ports/preset-store.js';

@Injectable()
export class ModelProviderDeletedEventsListener {
  constructor(@Inject(PRESET_STORE) private readonly store: PresetStore) {}

  @OnEvent(MODEL_PROVIDER_DELETED, { suppressErrors: false })
  onModelProviderDeleted(event: ModelProviderDeletedEvent): Promise<void> {
    return this.store.clearModelProviderAssociations(
      event.ownerUserId,
      event.modelProviderId,
    );
  }
}
