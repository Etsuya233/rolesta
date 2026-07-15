import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CHARACTER_DELETED, type CharacterDeletedEvent } from '../../characters/events/index.js';
import {
  MODEL_PROVIDER_DELETED,
  type ModelProviderDeletedEvent,
} from '../../model-profiles/events/index.js';
import { PRESET_DELETED, type PresetDeletedEvent } from '../../presets/events/index.js';
import { ASSET_DEFAULTS_STORE, type AssetDefaultsStore } from '../ports/asset-defaults-store.js';

@Injectable()
export class AssetDeletedEventsListener {
  constructor(@Inject(ASSET_DEFAULTS_STORE) private readonly store: AssetDefaultsStore) {}

  @OnEvent(CHARACTER_DELETED, { suppressErrors: false })
  onCharacterDeleted(event: CharacterDeletedEvent): Promise<void> {
    return this.store.clearPersonaCharacter(event.ownerUserId, event.characterId);
  }

  @OnEvent(PRESET_DELETED, { suppressErrors: false })
  onPresetDeleted(event: PresetDeletedEvent): Promise<void> {
    return this.store.clearPreset(event.ownerUserId, event.presetId);
  }

  @OnEvent(MODEL_PROVIDER_DELETED, { suppressErrors: false })
  onModelProviderDeleted(event: ModelProviderDeletedEvent): Promise<void> {
    return this.store.clearModelProvider(event.ownerUserId, event.modelProviderId);
  }
}
