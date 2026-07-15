import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  CHARACTER_DELETED,
  CHARACTER_VISIBILITY_CHANGED,
  type CharacterDeletedEvent,
  type CharacterVisibilityChangedEvent,
} from "../../characters/events/index.js";
import {
  MODEL_PROVIDER_DELETED,
  type ModelProviderDeletedEvent,
} from "../../model-profiles/events/index.js";
import {
  PRESET_DELETED,
  PRESET_VISIBILITY_CHANGED,
  type PresetDeletedEvent,
  type PresetVisibilityChangedEvent,
} from "../../presets/events/index.js";
import { CHAT_STORE, type ChatStore } from "../ports/chat-store.js";

@Injectable()
export class AssetVisibilityEventsListener {
  constructor(@Inject(CHAT_STORE) private readonly store: ChatStore) {}

  @OnEvent(CHARACTER_VISIBILITY_CHANGED, { suppressErrors: false })
  onCharacterVisibilityChanged(
    event: CharacterVisibilityChangedEvent,
  ): Promise<void> {
    return this.store.clearCharacterAssociations(
      event.characterId,
      event.ownerUserId,
    );
  }

  @OnEvent(PRESET_VISIBILITY_CHANGED, { suppressErrors: false })
  onPresetVisibilityChanged(
    event: PresetVisibilityChangedEvent,
  ): Promise<void> {
    return this.store.clearPresetAssociations(
      event.presetId,
      event.ownerUserId,
    );
  }

  @OnEvent(CHARACTER_DELETED, { suppressErrors: false })
  onCharacterDeleted(event: CharacterDeletedEvent): Promise<void> {
    return this.store.clearCharacterAssociations(event.characterId);
  }

  @OnEvent(PRESET_DELETED, { suppressErrors: false })
  onPresetDeleted(event: PresetDeletedEvent): Promise<void> {
    return this.store.clearPresetAssociations(event.presetId);
  }

  @OnEvent(MODEL_PROVIDER_DELETED, { suppressErrors: false })
  onModelProviderDeleted(event: ModelProviderDeletedEvent): Promise<void> {
    return this.store.clearModelProviderAssociations(
      event.modelProviderId,
      event.ownerUserId,
    );
  }
}
