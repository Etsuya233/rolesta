export const PRESET_MODEL_PROVIDER_ACCESS = Symbol('PresetModelProviderAccess');

export interface PresetModelProviderAccess {
  acquireOwned(modelProviderId: string, ownerUserId: string): Promise<boolean>;
}
