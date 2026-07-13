import type {
  AssetDefaultField,
  AssetDefaultsPatch,
} from "../domain/asset-defaults.js";

export type { AssetDefaultField } from "../domain/asset-defaults.js";

export const CHAT_ASSET_OWNERSHIP = Symbol("ChatAssetOwnership");

export interface ChatAssetOwnership {
  findUnavailableFields(
    userId: string,
    patch: AssetDefaultsPatch,
  ): Promise<AssetDefaultField[]>;
}
