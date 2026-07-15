import {
  ERROR_CODES,
  I18N_MESSAGE_PREFIX,
  SUPPORTED_LOCALES,
  type ApiErrorEnvelope,
  type SupportedLocale,
} from '@rolesta/shared';
import {
  BellRingIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleXIcon,
  InfoIcon,
  MousePointerClickIcon,
  ServerCrashIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Field, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { Textarea } from '../../../components/ui/textarea';
import { ApiError } from '../../../lib/api/client';
import { changeLocale, getActiveLocale } from '../../../lib/i18n/i18n';
import { LOCALE_STORAGE_KEY, readStoredLocale } from '../../../lib/i18n/locales';
import { notify, type ApiResponseError } from '../../../lib/notifications/notify';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

const localeLabels: Record<SupportedLocale, string> = {
  'en-US': 'English (en-US)',
  'zh-CN': '简体中文 (zh-CN)',
  'zh-TW': '繁體中文 (zh-TW)',
  'ja-JP': '日本語 (ja-JP)',
};

export function FeatureTestPanel() {
  const { t } = useTranslation();
  const [storedLocale, setStoredLocale] = useState(() => readStoredLocale(window.localStorage));
  const [type, setType] = useState<NotificationType>('success');
  const [title, setTitle] = useState(() => t('chats.workbench.testing.form.defaultTitle'));
  const [description, setDescription] = useState(() =>
    t('chats.workbench.testing.form.defaultDescription'),
  );
  const [duration, setDuration] = useState('4000');
  const [withAction, setWithAction] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [durationError, setDurationError] = useState(false);

  const switchLanguage = async (locale: SupportedLocale) => {
    await changeLocale(locale);
    setStoredLocale(locale);
  };

  const clearStoredLanguage = () => {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY);
    setStoredLocale(undefined);
  };

  const action = {
    label: t('chats.workbench.testing.notifications.actionLabel'),
    onClick: () =>
      notify.info({
        title: t('chats.workbench.testing.notifications.actionTriggered'),
      }),
  };

  const showApiError = () => {
    const envelope: ApiErrorEnvelope = {
      code: ERROR_CODES.VALIDATION_FAILED,
      msg: `${I18N_MESSAGE_PREFIX}errors.passwordTooShort`,
      data: { min: 12 },
    };
    const error = new ApiError(envelope.msg, {
      kind: 'response',
      code: envelope.code,
      envelope,
    }) as ApiResponseError;

    notify.apiError(error);
  };

  const submitNotification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const invalidTitle = title.trim().length === 0;
    const invalidDuration = duration.length > 0 && !/^[1-9]\d*$/.test(duration);

    setTitleError(invalidTitle);
    setDurationError(invalidDuration);

    if (invalidTitle || invalidDuration) {
      return;
    }

    notify[type]({
      title: title.trim(),
      ...(description.trim().length > 0 ? { description: description.trim() } : {}),
      ...(duration.length > 0 ? { duration: Number(duration) } : {}),
      ...(withAction ? { action } : {}),
    });
  };

  const quickDescription = t('chats.workbench.testing.notifications.sampleDescription');

  return (
    <main className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <header className="flex items-center gap-3 px-4 py-5 sm:px-6">
          <BellRingIcon className="size-5 text-muted-foreground" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">{t('chats.workbench.testing.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('chats.workbench.testing.description')}
            </p>
          </div>
        </header>

        <Separator />

        <section className="flex flex-col gap-4 px-4 py-5 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold">{t('chats.workbench.testing.language.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('chats.workbench.testing.language.description')}
            </p>
          </div>

          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="test-language-select">
                {t('chats.workbench.testing.language.selectLabel')}
              </FieldLabel>
              <Select
                value={getActiveLocale()}
                onValueChange={(value) => void switchLanguage(value as SupportedLocale)}
              >
                <SelectTrigger id="test-language-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SUPPORTED_LOCALES.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {localeLabels[locale]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <div className="flex flex-col justify-end gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {t('chats.workbench.testing.language.current')}
                </span>
                <Badge variant="secondary">{getActiveLocale()}</Badge>
                <span className="text-muted-foreground">
                  {t('chats.workbench.testing.language.stored')}
                </span>
                <Badge variant="outline">
                  {storedLocale ?? t('chats.workbench.testing.language.notStored')}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                className="self-start"
                disabled={storedLocale === undefined}
                onClick={clearStoredLanguage}
              >
                <Trash2Icon data-icon="inline-start" />
                {t('chats.workbench.testing.language.clear')}
              </Button>
            </div>
          </FieldGroup>
        </section>

        <Separator />

        <section className="flex flex-col gap-4 px-4 py-5 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold">
              {t('chats.workbench.testing.notifications.quickTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('chats.workbench.testing.notifications.quickDescription')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                notify.success({
                  title: t('chats.workbench.testing.notifications.success'),
                  description: quickDescription,
                })
              }
            >
              <CheckCircle2Icon data-icon="inline-start" />
              {t('chats.workbench.testing.notifications.success')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                notify.info({
                  title: t('chats.workbench.testing.notifications.info'),
                  description: quickDescription,
                })
              }
            >
              <InfoIcon data-icon="inline-start" />
              {t('chats.workbench.testing.notifications.info')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                notify.warning({
                  title: t('chats.workbench.testing.notifications.warning'),
                  description: quickDescription,
                })
              }
            >
              <CircleAlertIcon data-icon="inline-start" />
              {t('chats.workbench.testing.notifications.warning')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                notify.error({
                  title: t('chats.workbench.testing.notifications.error'),
                  description: quickDescription,
                })
              }
            >
              <CircleXIcon data-icon="inline-start" />
              {t('chats.workbench.testing.notifications.error')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                notify.info({
                  title: t('chats.workbench.testing.notifications.withAction'),
                  description: quickDescription,
                  action,
                })
              }
            >
              <MousePointerClickIcon data-icon="inline-start" />
              {t('chats.workbench.testing.notifications.withAction')}
            </Button>
            <Button type="button" variant="outline" onClick={showApiError}>
              <ServerCrashIcon data-icon="inline-start" />
              {t('chats.workbench.testing.notifications.apiError')}
            </Button>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4 px-4 py-5 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold">{t('chats.workbench.testing.form.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('chats.workbench.testing.form.description')}
            </p>
          </div>

          <form onSubmit={submitNotification}>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="test-notification-type">
                  {t('chats.workbench.testing.form.type')}
                </FieldLabel>
                <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
                  <SelectTrigger id="test-notification-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="success">
                        {t('chats.workbench.testing.notifications.success')}
                      </SelectItem>
                      <SelectItem value="info">
                        {t('chats.workbench.testing.notifications.info')}
                      </SelectItem>
                      <SelectItem value="warning">
                        {t('chats.workbench.testing.notifications.warning')}
                      </SelectItem>
                      <SelectItem value="error">
                        {t('chats.workbench.testing.notifications.error')}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field data-invalid={durationError}>
                <FieldLabel htmlFor="test-notification-duration">
                  {t('chats.workbench.testing.form.duration')}
                </FieldLabel>
                <Input
                  id="test-notification-duration"
                  inputMode="numeric"
                  value={duration}
                  aria-invalid={durationError}
                  onChange={(event) => setDuration(event.target.value)}
                />
                {durationError ? (
                  <FieldError>{t('chats.workbench.testing.form.durationError')}</FieldError>
                ) : null}
              </Field>

              <Field className="md:col-span-2" data-invalid={titleError}>
                <FieldLabel htmlFor="test-notification-title">
                  {t('chats.workbench.testing.form.notificationTitle')}
                </FieldLabel>
                <Input
                  id="test-notification-title"
                  value={title}
                  aria-invalid={titleError}
                  onChange={(event) => setTitle(event.target.value)}
                />
                {titleError ? (
                  <FieldError>{t('chats.workbench.testing.form.titleError')}</FieldError>
                ) : null}
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="test-notification-description">
                  {t('chats.workbench.testing.form.notificationDescription')}
                </FieldLabel>
                <Textarea
                  id="test-notification-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>

              <Field orientation="horizontal" className="md:col-span-2">
                <input
                  id="test-notification-action"
                  type="checkbox"
                  checked={withAction}
                  onChange={(event) => setWithAction(event.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
                <FieldLabel htmlFor="test-notification-action">
                  {t('chats.workbench.testing.form.withAction')}
                </FieldLabel>
              </Field>

              <div className="md:col-span-2">
                <Button type="submit">
                  <BellRingIcon data-icon="inline-start" />
                  {t('chats.workbench.testing.form.submit')}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </section>
      </div>
    </main>
  );
}
