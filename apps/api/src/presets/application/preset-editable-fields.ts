import type { PresetModelSettings } from '../domain/preset-model-settings.js';
import type { Preset } from '../domain/preset.js';
import type { PresetVisibility } from '../domain/preset.js';

export interface PresetEditableFields {
  visibility?: PresetVisibility;
  name?: string;
  modelProviderId?: string | null;
  modelSettings?: Partial<PresetModelSettings>;
}

export function applyPresetEditableFields(
  preset: Preset,
  fields: PresetEditableFields,
): Preset {
  return {
    ...preset,
    visibility: fields.visibility ?? preset.visibility,
    name: fields.name ?? preset.name,
    modelProviderId:
      fields.modelProviderId === undefined
        ? preset.modelProviderId
        : fields.modelProviderId,
    modelSettings:
      fields.modelSettings === undefined
        ? preset.modelSettings
        : { ...preset.modelSettings, ...fields.modelSettings },
  };
}
