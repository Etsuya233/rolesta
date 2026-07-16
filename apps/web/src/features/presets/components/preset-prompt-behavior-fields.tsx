import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, FieldLabel } from '../../../components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
import type {
  PresetEntryRole,
  PresetGenerationType,
  PresetPromptPlacement,
} from '../api/presets-api';
import { PresetNumberField, PresetSelectField } from './preset-form-fields';

const generationTypes: PresetGenerationType[] = [
  'normal',
  'continue',
  'impersonate',
  'swipe',
  'regenerate',
  'quiet',
];

export function PresetPromptBehaviorFields({
  role,
  placement,
  selectedGenerationTypes,
  disabled,
  onRoleChange,
  onPlacementChange,
  onGenerationTypesChange,
}: {
  role: PresetEntryRole;
  placement: PresetPromptPlacement;
  selectedGenerationTypes: PresetGenerationType[];
  disabled: boolean;
  onRoleChange: (role: PresetEntryRole) => void;
  onPlacementChange: (placement: PresetPromptPlacement) => void;
  onGenerationTypesChange: (generationTypes: PresetGenerationType[]) => void;
}) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const placementKind = placement.kind;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PresetSelectField
          disabled={disabled}
          id={`${fieldPrefix}-role`}
          label={t('presets.entries.fields.role')}
          options={[
            { value: 'system', label: t('presets.entries.roles.system') },
            { value: 'user', label: t('presets.entries.roles.user') },
            { value: 'assistant', label: t('presets.entries.roles.assistant') },
          ]}
          value={role}
          onChange={onRoleChange}
        />
        <PresetSelectField
          disabled={disabled}
          id={`${fieldPrefix}-placement`}
          label={t('presets.entries.fields.placement')}
          options={[
            { value: 'relative', label: t('presets.entries.placements.relative') },
            { value: 'inChat', label: t('presets.entries.placements.inChat') },
          ]}
          value={placementKind}
          onChange={(kind) =>
            onPlacementChange(
              kind === 'relative' ? { kind: 'relative' } : { kind: 'inChat', depth: 4, order: 100 },
            )
          }
        />
      </div>
      {placement.kind === 'inChat' ? (
        <div className="grid grid-cols-2 gap-3">
          <PresetNumberField
            disabled={disabled}
            id={`${fieldPrefix}-depth`}
            label={t('presets.entries.fields.depth')}
            value={placement.depth!}
            onChange={(depth) => {
              if (depth !== null) {
                onPlacementChange({ ...placement, depth });
              }
            }}
          />
          <PresetNumberField
            disabled={disabled}
            id={`${fieldPrefix}-order`}
            label={t('presets.entries.fields.order')}
            value={placement.order!}
            onChange={(order) => {
              if (order !== null) {
                onPlacementChange({ ...placement, order });
              }
            }}
          />
        </div>
      ) : null}
      <Field data-disabled={disabled}>
        <FieldLabel>{t('presets.entries.fields.generationTypes')}</FieldLabel>
        <ToggleGroup
          className="flex-wrap justify-start"
          disabled={disabled}
          type="multiple"
          value={selectedGenerationTypes}
          variant="outline"
          onValueChange={(values) => onGenerationTypesChange(values as PresetGenerationType[])}
        >
          {generationTypes.map((generationType) => (
            <ToggleGroupItem key={generationType} value={generationType}>
              {t(`presets.entries.generationTypes.${generationType}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
    </>
  );
}
