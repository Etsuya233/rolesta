import { useTranslation } from 'react-i18next';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { WorldbookEntryEditor } from './worldbook-entry-editor';
import type { WorldbookPage } from './worldbook-pages';
import { WorldbookStackPage } from './worldbook-stack-page';

export function WorldbookEntryCreatePage({
  page,
  onBack,
}: {
  page: Extract<WorldbookPage, { name: 'entryCreate' }>;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <WorldbookStackPage>
      <MobileTopBar title={t('worldbooks.entries.createTitle')} onBack={onBack} />
      <WorldbookEntryEditor
        sessionKey={page.sessionKey}
        worldbookId={page.worldbookId}
        submitLabel={t('worldbooks.entries.createSubmit')}
        onSaved={onBack}
      />
    </WorldbookStackPage>
  );
}
