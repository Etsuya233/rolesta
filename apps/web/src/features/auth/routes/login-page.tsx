import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getFormErrorMessage } from '../../../lib/forms/form-error';
import { AuthCredentialsForm } from '../components/auth-credentials-form';
import { AuthPageShell } from '../components/auth-page-shell';
import { useLoginMutation } from '../hooks/use-auth-mutations';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  return (
    <AuthPageShell
      header={
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">{t('auth.login.title')}</h1>
        </div>
      }
    >
      <AuthCredentialsForm
        buttonLabel={t('auth.login.submit')}
        isPending={loginMutation.isPending}
        onSubmit={(values) =>
          loginMutation.mutate(values, {
            onSuccess: () => {
              void navigate('/app');
            },
          })
        }
        passwordAutoComplete="current-password"
        serverError={loginMutation.error ? getFormErrorMessage(loginMutation.error) : undefined}
      />
    </AuthPageShell>
  );
}
