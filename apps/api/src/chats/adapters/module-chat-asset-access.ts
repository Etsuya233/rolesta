import type { CharacterReferenceAccess } from "../../characters/contracts/character-reference-access.js";
import type { ModelProviderReferenceAccess } from "../../model-profiles/contracts/model-provider-reference-access.js";
import type { PresetReferenceAccess } from "../../presets/contracts/preset-reference-access.js";
import type { ChatAssetAccess } from "../ports/chat-asset-access.js";

export class ModuleChatAssetAccess implements ChatAssetAccess {
  constructor(
    private readonly characters: CharacterReferenceAccess,
    private readonly presets: PresetReferenceAccess,
    private readonly modelProviders: ModelProviderReferenceAccess,
  ) {}

  acquireVisibleCharacter(
    characterId: string,
    viewerUserId: string,
  ): Promise<boolean> {
    return this.characters.acquireVisible(characterId, viewerUserId);
  }

  acquireVisiblePreset(
    presetId: string,
    viewerUserId: string,
  ): Promise<boolean> {
    return this.presets.acquireVisible(presetId, viewerUserId);
  }

  acquireOwnedModelProvider(
    modelProviderId: string,
    ownerUserId: string,
  ): Promise<boolean> {
    return this.modelProviders.acquireOwned(modelProviderId, ownerUserId);
  }
}
