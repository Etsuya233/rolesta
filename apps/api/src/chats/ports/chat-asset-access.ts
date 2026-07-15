export const CHAT_ASSET_ACCESS = Symbol("ChatAssetAccess");

export interface ChatAssetAccess {
  acquireVisibleCharacter(
    characterId: string,
    viewerUserId: string,
  ): Promise<boolean>;
  acquireVisiblePreset(
    presetId: string,
    viewerUserId: string,
  ): Promise<boolean>;
  acquireOwnedModelProvider(
    modelProviderId: string,
    ownerUserId: string,
  ): Promise<boolean>;
}
