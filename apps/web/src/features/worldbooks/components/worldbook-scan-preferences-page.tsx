import { useMutation, useQuery } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { getFormErrorMessage } from '../../../lib/forms/form-error';
import { notify } from '../../../lib/notifications/notify';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import {
  getWorldbookScanPreferences,
  updateWorldbookScanPreferences,
  type WorldbookScanPreferences,
} from '../api/worldbooks-api';
import {
  WorldbookCheckboxField,
  WorldbookNumberField,
  WorldbookSelectField,
} from './worldbook-form-fields';
import { WorldbookStackPage } from './worldbook-stack-page';

export function WorldbookScanPreferencesPage({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const [form, setForm] = useState<WorldbookScanPreferences | null>(null);
  const query = useQuery({
    queryKey: ['worldbook-scan-preferences'],
    queryFn: getWorldbookScanPreferences,
  });
  const mutation = useMutation({
    mutationFn: updateWorldbookScanPreferences,
    onSuccess(preferences) {
      setForm(preferences);
      notify.success({ title: t('worldbooks.scanPreferences.saved') });
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });

  useEffect(() => {
    if (query.data && form === null) setForm(query.data);
  }, [form, query.data]);

  useEffect(() => {
    if (query.isError) notify.error({ title: getFormErrorMessage(query.error) });
  }, [query.error, query.isError]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form) mutation.mutate(form);
  }

  return (
    <WorldbookStackPage>
      <MobileTopBar title={t('worldbooks.scanPreferences.title')} onBack={onBack} />
      {form ? (
        <form
          className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
          onSubmit={submit}
        >
          <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4">
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold">
                {t('worldbooks.scanPreferences.sections.scan')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberPreference
                  disabled={mutation.isPending}
                  field="scanDepth"
                  fieldPrefix={fieldPrefix}
                  form={form}
                  onChange={setForm}
                />
                <NumberPreference
                  disabled={mutation.isPending}
                  field="minActivations"
                  fieldPrefix={fieldPrefix}
                  form={form}
                  onChange={setForm}
                />
                <NumberPreference
                  disabled={mutation.isPending}
                  field="minActivationsDepthMax"
                  fieldPrefix={fieldPrefix}
                  form={form}
                  onChange={setForm}
                />
                <NumberPreference
                  disabled={mutation.isPending}
                  field="maxRecursionSteps"
                  fieldPrefix={fieldPrefix}
                  form={form}
                  onChange={setForm}
                />
              </div>
              <WorldbookCheckboxField
                checked={form.recursive}
                disabled={mutation.isPending}
                id={`${fieldPrefix}-recursive`}
                label={t('worldbooks.scanPreferences.fields.recursive')}
                onChange={(recursive) => setForm({ ...form, recursive })}
              />
            </section>

            <section className="grid gap-3 border-t border-border pt-5">
              <h2 className="text-sm font-semibold">
                {t('worldbooks.scanPreferences.sections.budget')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberPreference
                  disabled={mutation.isPending}
                  field="budgetPercent"
                  fieldPrefix={fieldPrefix}
                  form={form}
                  onChange={setForm}
                />
                <NumberPreference
                  disabled={mutation.isPending}
                  field="budgetCap"
                  fieldPrefix={fieldPrefix}
                  form={form}
                  onChange={setForm}
                />
              </div>
            </section>

            <section className="grid gap-3 border-t border-border pt-5">
              <h2 className="text-sm font-semibold">
                {t('worldbooks.scanPreferences.sections.matching')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  ['caseSensitive', 'matchWholeWords', 'useGroupScoring', 'includeNames'] as const
                ).map((field) => (
                  <WorldbookCheckboxField
                    key={field}
                    checked={form[field]}
                    disabled={mutation.isPending}
                    id={`${fieldPrefix}-${field}`}
                    label={t(`worldbooks.scanPreferences.fields.${field}`)}
                    onChange={(value) => setForm({ ...form, [field]: value })}
                  />
                ))}
              </div>
              <WorldbookSelectField
                disabled={mutation.isPending}
                id={`${fieldPrefix}-character-strategy`}
                label={t('worldbooks.scanPreferences.fields.characterLoreInsertionStrategy')}
                options={[
                  { value: 'evenly', label: t('worldbooks.scanPreferences.strategies.evenly') },
                  {
                    value: 'characterFirst',
                    label: t('worldbooks.scanPreferences.strategies.characterFirst'),
                  },
                  {
                    value: 'globalFirst',
                    label: t('worldbooks.scanPreferences.strategies.globalFirst'),
                  },
                ]}
                value={form.characterLoreInsertionStrategy}
                onChange={(characterLoreInsertionStrategy) =>
                  setForm({ ...form, characterLoreInsertionStrategy })
                }
              />
            </section>
          </div>
          <div className="shrink-0 border-t border-border p-4">
            <Button className="min-h-11 w-full" disabled={mutation.isPending} type="submit">
              <Save aria-hidden="true" />
              {t('worldbooks.scanPreferences.saveAction')}
            </Button>
          </div>
        </form>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">{t('worldbooks.list.loading')}</p>
      )}
    </WorldbookStackPage>
  );
}

type NumberPreferenceField =
  | 'scanDepth'
  | 'minActivations'
  | 'minActivationsDepthMax'
  | 'budgetPercent'
  | 'budgetCap'
  | 'maxRecursionSteps';

function NumberPreference({
  disabled,
  field,
  fieldPrefix,
  form,
  onChange,
}: {
  disabled: boolean;
  field: NumberPreferenceField;
  fieldPrefix: string;
  form: WorldbookScanPreferences;
  onChange: (form: WorldbookScanPreferences) => void;
}) {
  const { t } = useTranslation();

  return (
    <WorldbookNumberField
      disabled={disabled}
      id={`${fieldPrefix}-${field}`}
      label={t(`worldbooks.scanPreferences.fields.${field}`)}
      value={form[field]}
      onChange={(value) => onChange({ ...form, [field]: value ?? 0 })}
    />
  );
}
