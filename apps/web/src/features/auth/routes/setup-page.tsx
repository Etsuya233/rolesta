import { useTranslation } from 'react-i18next';

export function SetupPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <h1 className="text-xl font-semibold">{t('auth.setup.title')}</h1>
    </main>
  );
}
