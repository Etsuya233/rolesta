import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoginFormValues } from '../schemas/login-schema';
import { loginSchema } from '../schemas/login-schema';

type AuthCredentialsFormProps = {
  buttonLabel: string;
  isPending: boolean;
  passwordAutoComplete: 'current-password' | 'new-password';
  serverError?: string | undefined;
  onSubmit: (values: LoginFormValues) => void;
};

export function AuthCredentialsForm({
  buttonLabel,
  isPending,
  passwordAutoComplete,
  serverError,
  onSubmit,
}: AuthCredentialsFormProps) {
  const { t } = useTranslation();
  const usernameId = useId();
  const passwordId = useId();
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const formData = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      username: formData.get('username'),
      password: formData.get('password'),
    });

    if (!result.success) {
      setValidationError(t('auth.form.validation'));
      return;
    }

    onSubmit(result.data);
  }

  const errorMessage = validationError ?? serverError;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor={usernameId}>
          {t('auth.form.username')}
        </label>
        <input
          autoComplete="username"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          id={usernameId}
          name="username"
          type="text"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor={passwordId}>
          {t('auth.form.password')}
        </label>
        <input
          autoComplete={passwordAutoComplete}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          id={passwordId}
          name="password"
          type="password"
        />
      </div>
      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <button
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
        disabled={isPending}
        type="submit"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
