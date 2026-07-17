import { countPromptTokens } from '@rolesta/shared';
import { RotateCcw } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { usePresetDraftSession } from '../hooks/use-preset-draft-sessions';
import type { PresetDocumentPromptItem } from '../api/presets-api';
import { isContentSlotItem, isSystemPromptItem } from '../model/preset-editor-form';
import { restoreSystemPromptDefault } from '../model/preset-system-prompt-defaults';
import {
  FormSubmitButton,
  PresetCheckboxField,
  PresetTextAreaField,
  PresetTextField,
} from './preset-form-fields';
import { PresetPromptBehaviorFields } from './preset-prompt-behavior-fields';

export function PresetSystemItemEditor({
  presetId,
  sessionKey,
  itemId,
}: {
  presetId: string;
  sessionKey: string;
  itemId: string;
}) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const { document, setDocument, isDirty, isPending, saveDocument } = usePresetDraftSession({
    presetId,
    sessionKey,
  });
  const item = document.promptItems.find((candidate) => candidate.id === itemId);

  if (!item || (!isSystemPromptItem(item) && !isContentSlotItem(item))) {
    return null;
  }
  const editableItem = item;

  function updateItem(nextItem: PresetDocumentPromptItem) {
    setDocument((current) => ({
      ...current,
      promptItems: current.promptItems.map((candidate) =>
        candidate.id === editableItem.id ? nextItem : candidate,
      ),
    }));
  }

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={(event) => {
        event.preventDefault();
        saveDocument();
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {isSystemPromptItem(editableItem) ? (
            <PresetTextField
              disabled={isPending}
              id={`${fieldPrefix}-name`}
              label={t('presets.entries.fields.name')}
              value={editableItem.name}
              onChange={(event) => updateItem({ ...editableItem, name: event.target.value })}
            />
          ) : null}
          <PresetPromptBehaviorFields
            disabled={isPending}
            placement={editableItem.placement}
            role={editableItem.role}
            selectedGenerationTypes={editableItem.generationTypes}
            onGenerationTypesChange={(generationTypes) =>
              updateItem({ ...editableItem, generationTypes })
            }
            onPlacementChange={(placement) => updateItem({ ...editableItem, placement })}
            onRoleChange={(role) => updateItem({ ...editableItem, role })}
          />
          {isSystemPromptItem(editableItem) ? (
            <>
              <PresetTextAreaField
                disabled={isPending}
                id={`${fieldPrefix}-content`}
                label={t('presets.entries.fields.content')}
                rows={14}
                value={editableItem.content}
                onChange={(event) => updateItem({ ...editableItem, content: event.target.value })}
              />
              <div className="rounded-md border border-border px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t('presets.metrics.tokenCount')} </span>
                <span className="font-semibold tabular-nums">
                  {countPromptTokens(editableItem.content).toLocaleString()}
                </span>
              </div>
              {editableItem.systemPrompt === 'mainPrompt' ||
              editableItem.systemPrompt === 'postHistoryInstructions' ? (
                <PresetCheckboxField
                  checked={editableItem.allowCharacterOverride!}
                  disabled={isPending}
                  id={`${fieldPrefix}-override`}
                  label={t('presets.systemItems.allowCharacterOverride')}
                  onChange={(allowCharacterOverride) =>
                    updateItem({ ...editableItem, allowCharacterOverride })
                  }
                />
              ) : null}
              <Button
                disabled={isPending}
                type="button"
                variant="outline"
                onClick={() => updateItem(restoreSystemPromptDefault(editableItem))}
              >
                <RotateCcw data-icon="inline-start" />
                {t('presets.systemItems.restoreDefault')}
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        <FormSubmitButton disabled={isPending || !isDirty}>
          {t('presets.entries.saveSubmit')}
        </FormSubmitButton>
      </div>
    </form>
  );
}
