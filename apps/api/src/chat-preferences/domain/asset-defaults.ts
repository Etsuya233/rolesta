export const ASSET_DEFAULT_FIELDS = ['personaCharacterId', 'presetId', 'modelProviderId'] as const;

export type AssetDefaultField = (typeof ASSET_DEFAULT_FIELDS)[number];

export interface AssetDefaults {
  personaCharacterId: string | null;
  presetId: string | null;
  modelProviderId: string | null;
}

export interface AssetDefaultsPatch {
  personaCharacterId?: string | null;
  presetId?: string | null;
  modelProviderId?: string | null;
}
