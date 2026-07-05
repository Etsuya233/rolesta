import type { PresetModelSettings } from '../domain/preset-model-settings.js';
import type { Preset } from '../domain/preset.js';

export interface PresetEditableFields {
  name?: string;
  modelSettings?: Partial<PresetModelSettings>;
}

export function applyPresetEditableFields(
  preset: Preset,
  fields: PresetEditableFields,
): Preset {
  return {
    ...preset,
    name: fields.name ?? preset.name,
    modelProviderId: null,
    modelSettings:
      fields.modelSettings === undefined
        ? preset.modelSettings
        : { ...preset.modelSettings, ...fields.modelSettings },
  };
}
