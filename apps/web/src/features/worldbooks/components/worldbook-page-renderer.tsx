import { WorldbookCreatePage } from './worldbook-create-page';
import { WorldbookEditPage } from './worldbook-edit-page';
import { WorldbookEntryCreatePage } from './worldbook-entry-create-page';
import { WorldbookEntryEditPage } from './worldbook-entry-edit-page';
import { WorldbookEntryListPage } from './worldbook-entry-list-page';
import { WorldbookImportPage } from './worldbook-import-page';
import { WorldbookListPage } from './worldbook-list-page';
import {
  createWorldbookPage,
  editWorldbookPage,
  importWorldbookPage,
  type WorldbookPage,
} from './worldbook-pages';

export function WorldbookPageRenderer({
  page,
  onRootBack,
  popPage,
  pushPage,
  replacePage,
}: {
  page: WorldbookPage;
  onRootBack: () => void;
  popPage: () => void;
  pushPage: (page: WorldbookPage) => void;
  replacePage: (page: WorldbookPage) => void;
}) {
  if (page.name === 'list') {
    return (
      <WorldbookListPage
        onBack={onRootBack}
        onCreate={() => pushPage(createWorldbookPage())}
        onImport={() => pushPage(importWorldbookPage())}
        onSelectWorldbook={(worldbookId) => pushPage(editWorldbookPage(worldbookId))}
      />
    );
  }

  if (page.name === 'create') {
    return <WorldbookCreatePage page={page} replacePage={replacePage} onBack={popPage} />;
  }

  if (page.name === 'editMain') {
    return <WorldbookEditPage page={page} pushPage={pushPage} onBack={popPage} />;
  }

  if (page.name === 'entryList') {
    return <WorldbookEntryListPage page={page} pushPage={pushPage} onBack={popPage} />;
  }

  if (page.name === 'entryCreate') {
    return <WorldbookEntryCreatePage page={page} onBack={popPage} />;
  }

  if (page.name === 'entryEdit') {
    return <WorldbookEntryEditPage page={page} onBack={popPage} />;
  }

  return <WorldbookImportPage replacePage={replacePage} onBack={popPage} />;
}
