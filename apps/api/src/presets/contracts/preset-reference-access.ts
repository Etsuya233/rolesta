export const PRESET_REFERENCE_ACCESS = Symbol('PresetReferenceAccess');

export interface PresetReferenceAccess {
  acquireVisible(presetId: string, viewerUserId: string): Promise<boolean>;
}
