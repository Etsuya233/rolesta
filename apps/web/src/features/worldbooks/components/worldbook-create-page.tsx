import { useTranslation } from 'react-i18next';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { useWorldbookDraftSessionActions } from '../hooks/use-worldbook-draft-sessions';
import { WorldbookMainEditor } from './worldbook-main-editor';
import { editWorldbookPage, type WorldbookPage, worldbookSessionKey } from './worldbook-pages';
import { WorldbookStackPage } from './worldbook-stack-page';

export function WorldbookCreatePage({
  page,
  replacePage,
  onBack,
}: {
  page: Extract<WorldbookPage, { name: 'create' }>;
  replacePage: (page: WorldbookPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { moveSessionToWorldbook } = useWorldbookDraftSessionActions();

  return (
    <WorldbookStackPage>
      <MobileTopBar title={t('worldbooks.editor.createTitle')} onBack={onBack} />
      <WorldbookMainEditor
        sessionKey={page.sessionKey}
        submitLabel={t('worldbooks.editor.createSubmit')}
        onCreated={(worldbook) => {
          moveSessionToWorldbook(page.sessionKey, worldbookSessionKey(worldbook.id), worldbook);
          replacePage(editWorldbookPage(worldbook.id));
        }}
      />
    </WorldbookStackPage>
  );
}
