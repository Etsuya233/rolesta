import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getFormErrorMessage } from '../../../lib/forms/form-error';
import { AuthCredentialsForm } from '../components/auth-credentials-form';
import { AuthPageShell } from '../components/auth-page-shell';
import { useSetupAdminMutation } from '../hooks/use-auth-mutations';

export function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setupAdminMutation = useSetupAdminMutation();

  return (
    <AuthPageShell showBrandPanel={false}>
      <AuthCredentialsForm
        buttonLabel={t('auth.setup.submit')}
        isPending={setupAdminMutation.isPending}
        onSubmit={(values) =>
          setupAdminMutation.mutate(values, {
            onSuccess: () => {
              void navigate('/app');
            },
          })
        }
        passwordAutoComplete="new-password"
        serverError={
          setupAdminMutation.error ? getFormErrorMessage(setupAdminMutation.error) : undefined
        }
      />
    </AuthPageShell>
  );
}
