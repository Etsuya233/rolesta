import type {
  AssetDefaults,
  AssetDefaultsPatch,
} from "../domain/asset-defaults.js";

export const ASSET_DEFAULTS_STORE = Symbol("AssetDefaultsStore");

export interface AssetDefaultsStore {
  get(userId: string): Promise<AssetDefaults>;
  update(userId: string, patch: AssetDefaultsPatch): Promise<AssetDefaults>;
  clearPersonaCharacter(userId: string, characterId: string): Promise<void>;
  clearPreset(userId: string, presetId: string): Promise<void>;
  clearModelProvider(userId: string, modelProviderId: string): Promise<void>;
}
