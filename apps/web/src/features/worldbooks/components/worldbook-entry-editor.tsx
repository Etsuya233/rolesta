import { countPromptTokens } from '@rolesta/shared';
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { notify } from '../../../lib/notifications/notify';
import { cn } from '../../../lib/utils';
import {
  type WorldbookEntryRole,
  type WorldbookInsertionPosition,
  type WorldbookSelectiveLogic,
} from '../api/worldbooks-api';
import { useWorldbookDraftSession } from '../hooks/use-worldbook-draft-sessions';
import {
  emptyWorldbookEntryEditorForm,
  worldbookEntryEditorFormFromEntry,
  worldbookEntryValuesFromForm,
  type WorldbookEntryEditorFormState,
} from '../model/worldbook-editor-form';
import {
  FormSubmitButton,
  WorldbookCheckboxField,
  WorldbookNumberField,
  WorldbookSelectField,
  WorldbookTextAreaField,
  WorldbookTextField,
} from './worldbook-form-fields';

export function WorldbookEntryEditor({
  worldbookId,
  sessionKey,
  entryId,
  submitLabel,
  onSaved,
}: {
  worldbookId: string;
  sessionKey: string;
  entryId?: string;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const [form, setForm] = useState<WorldbookEntryEditorFormState>(emptyWorldbookEntryEditorForm);
  const { document, setDocument, isDirty, isPending, saveDocument } = useWorldbookDraftSession({
    worldbookId,
    sessionKey,
  });
  const entry = document.entries.find((candidate) => candidate.id === entryId);
  const positionOptions: Array<{
    value: WorldbookInsertionPosition;
    label: string;
  }> = [
    {
      value: 'beforeCharacterDefinition',
      label: t('worldbooks.entries.positions.beforeCharacterDefinition'),
    },
    {
      value: 'afterCharacterDefinition',
      label: t('worldbooks.entries.positions.afterCharacterDefinition'),
    },
    {
      value: 'beforeExampleMessages',
      label: t('worldbooks.entries.positions.beforeExampleMessages'),
    },
    {
      value: 'afterExampleMessages',
      label: t('worldbooks.entries.positions.afterExampleMessages'),
    },
    {
      value: 'beforeAuthorsNote',
      label: t('worldbooks.entries.positions.beforeAuthorsNote'),
    },
    {
      value: 'afterAuthorsNote',
      label: t('worldbooks.entries.positions.afterAuthorsNote'),
    },
    { value: 'atDepth', label: t('worldbooks.entries.positions.atDepth') },
    { value: 'atAnchor', label: t('worldbooks.entries.positions.atAnchor') },
    { value: 'unknown', label: t('worldbooks.entries.positions.unknown') },
  ];
  const roleOptions: Array<{ value: WorldbookEntryRole; label: string }> = [
    { value: 'system', label: t('worldbooks.entries.roles.system') },
    { value: 'user', label: t('worldbooks.entries.roles.user') },
    { value: 'assistant', label: t('worldbooks.entries.roles.assistant') },
  ];
  const selectiveLogicOptions: Array<{
    value: WorldbookSelectiveLogic;
    label: string;
  }> = [
    { value: 'andAny', label: t('worldbooks.entries.selectiveLogic.andAny') },
    { value: 'andAll', label: t('worldbooks.entries.selectiveLogic.andAll') },
    { value: 'notAll', label: t('worldbooks.entries.selectiveLogic.notAll') },
    { value: 'notAny', label: t('worldbooks.entries.selectiveLogic.notAny') },
  ];
  const inheritedBooleanOptions = [
    { value: 'inherit', label: t('worldbooks.entries.inherited.followPreferences') },
    { value: 'enabled', label: t('worldbooks.entries.inherited.enabled') },
    { value: 'disabled', label: t('worldbooks.entries.inherited.disabled') },
  ];
  const generationTriggers = [
    'normal',
    'continue',
    'impersonate',
    'swipe',
    'regenerate',
    'quiet',
  ] as const;

  useEffect(() => {
    if (entry) {
      setForm(
        worldbookEntryEditorFormFromEntry(entry),
      );
    }
  }, [document.entries, entry]);

  function updateForm(nextForm: WorldbookEntryEditorFormState) {
    setForm(nextForm);

    if (!entryId || !entry) {
      return;
    }

    const nextEntry = {
      id: entryId,
      ...worldbookEntryValuesFromForm(nextForm),
    };
    setDocument((current) => {
      return {
        ...current,
        entries: current.entries.map((candidate) =>
          candidate.id === entryId ? nextEntry : candidate,
        ),
      };
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      notify.error({ title: t('worldbooks.entries.errors.nameRequired') });
      return;
    }

    const values = worldbookEntryValuesFromForm(form);
    const id = entryId ?? crypto.randomUUID();
    let entries = [...document.entries];
    const nextEntry = { id, ...values };

    if (entryId) {
      entries = entries.map((candidate) => (candidate.id === entryId ? nextEntry : candidate));
    } else {
      entries.push(nextEntry);
    }

    saveDocument({ ...document, entries }, onSaved);
  }

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={submit}
    >
      <div className={cn('min-h-0 flex-1 overflow-y-auto p-4', !submitLabel && 'pb-24')}>
        <div className="flex flex-col gap-5">
          <WorldbookEntrySection title={t('worldbooks.entries.sections.basic')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookTextField
                disabled={isPending}
                id={`${fieldPrefix}-name`}
                label={t('worldbooks.entries.fields.name')}
                value={form.name}
                onChange={(event) => updateForm({ ...form, name: event.target.value })}
              />
              <WorldbookNumberField
                disabled={isPending}
                id={`${fieldPrefix}-probability`}
                label={t('worldbooks.entries.fields.probability')}
                value={form.probability}
                onChange={(probability) => updateForm({ ...form, probability: probability ?? 0 })}
              />
            </div>
            <WorldbookTextAreaField
              className="min-h-24"
              disabled={isPending}
              id={`${fieldPrefix}-comment`}
              label={t('worldbooks.entries.fields.comment')}
              rows={3}
              value={form.comment}
              onChange={(event) => updateForm({ ...form, comment: event.target.value })}
            />
          </WorldbookEntrySection>

          <WorldbookEntrySection title={t('worldbooks.entries.sections.content')}>
            <WorldbookTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-content`}
              label={t('worldbooks.entries.fields.content')}
              rows={10}
              value={form.content}
              onChange={(event) => updateForm({ ...form, content: event.target.value })}
            />
            <div className="rounded-md border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t('worldbooks.metrics.tokenCount')} </span>
              <span className="font-semibold tabular-nums">
                {countPromptTokens(form.content).toLocaleString()}
              </span>
            </div>
          </WorldbookEntrySection>

          <WorldbookEntrySection title={t('worldbooks.entries.sections.matching')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookTextAreaField
                className="min-h-20"
                disabled={isPending}
                id={`${fieldPrefix}-primary-keys`}
                label={t('worldbooks.entries.fields.primaryKeys')}
                rows={2}
                value={form.primaryKeysText}
                onChange={(event) => updateForm({ ...form, primaryKeysText: event.target.value })}
              />
              <WorldbookTextAreaField
                className="min-h-20"
                disabled={isPending}
                id={`${fieldPrefix}-secondary-keys`}
                label={t('worldbooks.entries.fields.secondaryKeys')}
                rows={2}
                value={form.secondaryKeysText}
                onChange={(event) => updateForm({ ...form, secondaryKeysText: event.target.value })}
              />
            </div>
            <WorldbookSelectField
              disabled={isPending}
              id={`${fieldPrefix}-selective-logic`}
              label={t('worldbooks.entries.fields.selectiveLogic')}
              options={selectiveLogicOptions}
              value={form.selectiveLogic}
              onChange={(selectiveLogic) => updateForm({ ...form, selectiveLogic })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookCheckboxField
                checked={form.constant}
                disabled={isPending}
                id={`${fieldPrefix}-constant`}
                label={t('worldbooks.entries.fields.constant')}
                onChange={(constant) => updateForm({ ...form, constant })}
              />
              <WorldbookCheckboxField
                checked={form.selective}
                disabled={isPending}
                id={`${fieldPrefix}-selective`}
                label={t('worldbooks.entries.fields.selective')}
                onChange={(selective) => updateForm({ ...form, selective })}
              />
              <WorldbookCheckboxField
                checked={form.useProbability}
                disabled={isPending}
                id={`${fieldPrefix}-use-probability`}
                label={t('worldbooks.entries.fields.useProbability')}
                onChange={(useProbability) => updateForm({ ...form, useProbability })}
              />
              <WorldbookCheckboxField
                checked={form.ignoreBudget}
                disabled={isPending}
                id={`${fieldPrefix}-ignore-budget`}
                label={t('worldbooks.entries.fields.ignoreBudget')}
                onChange={(ignoreBudget) => updateForm({ ...form, ignoreBudget })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookSelectField
                disabled={isPending}
                id={`${fieldPrefix}-case-sensitive`}
                label={t('worldbooks.entries.fields.caseSensitive')}
                options={inheritedBooleanOptions}
                value={inheritedBooleanValue(form.caseSensitive)}
                onChange={(value) =>
                  updateForm({ ...form, caseSensitive: inheritedBoolean(value) })
                }
              />
              <WorldbookSelectField
                disabled={isPending}
                id={`${fieldPrefix}-whole-words`}
                label={t('worldbooks.entries.fields.matchWholeWords')}
                options={inheritedBooleanOptions}
                value={inheritedBooleanValue(form.matchWholeWords)}
                onChange={(value) =>
                  updateForm({ ...form, matchWholeWords: inheritedBoolean(value) })
                }
              />
            </div>
          </WorldbookEntrySection>

          <WorldbookEntrySection title={t('worldbooks.entries.sections.scanSources')}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  'matchPersonaDescription',
                  'matchCharacterDescription',
                  'matchCharacterPersonality',
                  'matchCharacterDepthPrompt',
                  'matchScenario',
                  'matchCreatorNotes',
                ] as const
              ).map((field) => (
                <WorldbookCheckboxField
                  key={field}
                  checked={form[field]}
                  disabled={isPending}
                  id={`${fieldPrefix}-${field}`}
                  label={t(`worldbooks.entries.fields.${field}`)}
                  onChange={(value) => updateForm({ ...form, [field]: value })}
                />
              ))}
            </div>
          </WorldbookEntrySection>

          <WorldbookEntrySection title={t('worldbooks.entries.sections.insertion')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookSelectField
                disabled={isPending}
                id={`${fieldPrefix}-position`}
                label={t('worldbooks.entries.fields.insertionPosition')}
                options={positionOptions}
                value={form.insertionPosition}
                onChange={(insertionPosition) => updateForm({ ...form, insertionPosition })}
              />
              <WorldbookNumberField
                disabled={isPending}
                id={`${fieldPrefix}-order`}
                label={t('worldbooks.entries.fields.insertionOrder')}
                value={form.insertionOrder}
                onChange={(insertionOrder) =>
                  updateForm({
                    ...form,
                    insertionOrder: insertionOrder ?? 0,
                  })
                }
              />
            </div>
            {form.insertionPosition === 'atDepth' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <WorldbookNumberField
                  disabled={isPending}
                  id={`${fieldPrefix}-depth`}
                  label={t('worldbooks.entries.fields.depth')}
                  value={form.depth}
                  onChange={(depth) => updateForm({ ...form, depth: depth ?? 0 })}
                />
                <WorldbookSelectField
                  disabled={isPending}
                  id={`${fieldPrefix}-role`}
                  label={t('worldbooks.entries.fields.insertionRole')}
                  options={roleOptions}
                  value={form.insertionRole}
                  onChange={(insertionRole) => updateForm({ ...form, insertionRole })}
                />
              </div>
            ) : null}
            {form.insertionPosition === 'atAnchor' ? (
              <WorldbookTextField
                disabled={isPending}
                id={`${fieldPrefix}-anchor-name`}
                label={t('worldbooks.entries.fields.anchorName')}
                value={form.anchorName}
                onChange={(event) => updateForm({ ...form, anchorName: event.target.value })}
              />
            ) : null}
          </WorldbookEntrySection>

          <WorldbookEntrySection title={t('worldbooks.entries.sections.scanAndRecursion')}>
            <WorldbookNumberField
              disabled={isPending}
              id={`${fieldPrefix}-entry-scan-depth`}
              label={t('worldbooks.entries.fields.entryScanDepth')}
              value={form.scanDepth}
              onChange={(scanDepth) => updateForm({ ...form, scanDepth })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookCheckboxField
                checked={form.excludeRecursion}
                disabled={isPending}
                id={`${fieldPrefix}-exclude-recursion`}
                label={t('worldbooks.entries.fields.excludeRecursion')}
                onChange={(excludeRecursion) => updateForm({ ...form, excludeRecursion })}
              />
              <WorldbookCheckboxField
                checked={form.preventRecursion}
                disabled={isPending}
                id={`${fieldPrefix}-prevent-recursion`}
                label={t('worldbooks.entries.fields.preventRecursion')}
                onChange={(preventRecursion) => updateForm({ ...form, preventRecursion })}
              />
              <WorldbookNumberField
                disabled={isPending}
                id={`${fieldPrefix}-delay-until-recursion`}
                label={t('worldbooks.entries.fields.delayUntilRecursion')}
                value={form.delayUntilRecursion}
                onChange={(delayUntilRecursion) =>
                  updateForm({ ...form, delayUntilRecursion: delayUntilRecursion ?? 0 })
                }
              />
            </div>
          </WorldbookEntrySection>

          <WorldbookEntrySection title={t('worldbooks.entries.sections.grouping')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookTextField
                disabled={isPending}
                id={`${fieldPrefix}-group`}
                label={t('worldbooks.entries.fields.group')}
                value={form.group}
                onChange={(event) => updateForm({ ...form, group: event.target.value })}
              />
              <WorldbookNumberField
                disabled={isPending}
                id={`${fieldPrefix}-group-weight`}
                label={t('worldbooks.entries.fields.groupWeight')}
                value={form.groupWeight}
                onChange={(groupWeight) => updateForm({ ...form, groupWeight: groupWeight ?? 0 })}
              />
              <WorldbookCheckboxField
                checked={form.groupOverride}
                disabled={isPending}
                id={`${fieldPrefix}-group-override`}
                label={t('worldbooks.entries.fields.groupOverride')}
                onChange={(groupOverride) => updateForm({ ...form, groupOverride })}
              />
              <WorldbookSelectField
                disabled={isPending}
                id={`${fieldPrefix}-group-scoring`}
                label={t('worldbooks.entries.fields.useGroupScoring')}
                options={inheritedBooleanOptions}
                value={inheritedBooleanValue(form.useGroupScoring)}
                onChange={(value) =>
                  updateForm({ ...form, useGroupScoring: inheritedBoolean(value) })
                }
              />
            </div>
          </WorldbookEntrySection>

          <WorldbookEntrySection title={t('worldbooks.entries.sections.timing')}>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['sticky', 'cooldown', 'delay'] as const).map((field) => (
                <WorldbookNumberField
                  key={field}
                  disabled={isPending}
                  id={`${fieldPrefix}-${field}`}
                  label={t(`worldbooks.entries.fields.${field}`)}
                  value={form[field]}
                  onChange={(value) => updateForm({ ...form, [field]: value })}
                />
              ))}
            </div>
          </WorldbookEntrySection>

          <WorldbookEntrySection title={t('worldbooks.entries.sections.filters')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookTextAreaField
                className="min-h-20"
                disabled={isPending}
                id={`${fieldPrefix}-character-filter-names`}
                label={t('worldbooks.entries.fields.characterFilterNames')}
                rows={2}
                value={form.characterFilterNamesText}
                onChange={(event) =>
                  updateForm({ ...form, characterFilterNamesText: event.target.value })
                }
              />
              <WorldbookTextAreaField
                className="min-h-20"
                disabled={isPending}
                id={`${fieldPrefix}-character-filter-tags`}
                label={t('worldbooks.entries.fields.characterFilterTags')}
                rows={2}
                value={form.characterFilterTagsText}
                onChange={(event) =>
                  updateForm({ ...form, characterFilterTagsText: event.target.value })
                }
              />
            </div>
            <WorldbookCheckboxField
              checked={form.characterFilterExclude}
              disabled={isPending}
              id={`${fieldPrefix}-character-filter-exclude`}
              label={t('worldbooks.entries.fields.characterFilterExclude')}
              onChange={(characterFilterExclude) => updateForm({ ...form, characterFilterExclude })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {generationTriggers.map((trigger) => (
                <WorldbookCheckboxField
                  key={trigger}
                  checked={form.triggers.includes(trigger)}
                  disabled={isPending}
                  id={`${fieldPrefix}-trigger-${trigger}`}
                  label={t(`worldbooks.entries.triggers.${trigger}`)}
                  onChange={(checked) =>
                    updateForm({
                      ...form,
                      triggers: checked
                        ? [...form.triggers, trigger]
                        : form.triggers.filter((item) => item !== trigger),
                    })
                  }
                />
              ))}
            </div>
          </WorldbookEntrySection>
        </div>
      </div>

      {submitLabel ? (
        <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
          <FormSubmitButton disabled={isPending || Boolean(entryId && !isDirty)}>
            {submitLabel}
          </FormSubmitButton>
        </div>
      ) : null}
    </form>
  );
}

function WorldbookEntrySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function inheritedBooleanValue(value: boolean | null): 'inherit' | 'enabled' | 'disabled' {
  return value === null ? 'inherit' : value ? 'enabled' : 'disabled';
}

function inheritedBoolean(value: string): boolean | null {
  return value === 'inherit' ? null : value === 'enabled';
}
