import { useMemo } from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { KeepAliveStackViewport } from '../../../components/keep-alive-stack/keep-alive-stack-viewport';
import { useKeepAliveStack } from '../../../components/keep-alive-stack/use-keep-alive-stack';
import { notify } from '../../../lib/notifications/notify';
import {
  WorldbookDraftSessionsProvider,
  useWorldbookDraftSession,
  useRetainWorldbookDraftSessions,
} from '../hooks/use-worldbook-draft-sessions';
import { WorldbookPageRenderer } from './worldbook-page-renderer';
import { worldbookListPage, type WorldbookPage } from './worldbook-pages';

export function WorldbookManager({ onBack }: { onBack: () => void }) {
  const { pages, activePage, pushPage, popPage, replacePage } =
    useKeepAliveStack(worldbookListPage);
  const retainedSessionKeys = useMemo(() => worldbookDraftSessionKeys(pages), [pages]);

  return (
    <main className="relative isolate flex h-dvh max-h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <WorldbookDraftSessionsProvider>
        <WorldbookDraftSessionRetainer sessionKeys={retainedSessionKeys} />
        <KeepAliveStackViewport
          activeKey={activePage.key}
          pages={pages}
          renderPage={(page) => (
            <WorldbookPageRenderer
              page={page}
              popPage={popPage}
              pushPage={pushPage}
              replacePage={replacePage}
              onRootBack={onBack}
            />
          )}
        />
        {isWorldbookSavePage(activePage) ? <WorldbookFloatingSave page={activePage} /> : null}
      </WorldbookDraftSessionsProvider>
    </main>
  );
}

type WorldbookSavePage = Extract<WorldbookPage, { name: 'editMain' | 'entryList' | 'entryEdit' }>;

function WorldbookFloatingSave({ page }: { page: WorldbookSavePage }) {
  const { t } = useTranslation();
  const { document, isDirty, isPending, saveDocument } = useWorldbookDraftSession({
    sessionKey: page.sessionKey,
    worldbookId: page.worldbookId,
    hydrateFromQueryOnMount: page.name === 'editMain',
  });

  function saveActiveDraft() {
    if (page.name === 'entryEdit') {
      const entry = document.entries.find((candidate) => candidate.id === page.entryId);

      if (!entry?.name.trim()) {
        notify.error({
          title: t('worldbooks.entries.errors.nameRequired'),
        });
        return;
      }
    }

    saveDocument();
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 mx-auto flex w-full max-w-2xl justify-end px-4"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <Button
        className="pointer-events-auto min-h-11 px-4 shadow-lg"
        data-testid="worldbook-floating-save"
        disabled={isPending || !isDirty}
        type="button"
        onClick={saveActiveDraft}
      >
        <Save aria-hidden="true" />
        {t('worldbooks.savePreset')}
      </Button>
    </div>
  );
}

function isWorldbookSavePage(page: WorldbookPage): page is WorldbookSavePage {
  return page.name === 'editMain' || page.name === 'entryList' || page.name === 'entryEdit';
}

function WorldbookDraftSessionRetainer({ sessionKeys }: { sessionKeys: string[] }) {
  useRetainWorldbookDraftSessions(sessionKeys);
  return null;
}

function worldbookDraftSessionKeys(pages: WorldbookPage[]): string[] {
  const sessionKeys = new Set<string>();

  for (const page of pages) {
    if (
      page.name === 'create' ||
      page.name === 'editMain' ||
      page.name === 'entryList' ||
      page.name === 'entryCreate' ||
      page.name === 'entryEdit'
    ) {
      sessionKeys.add(page.sessionKey);
    }
  }

  return [...sessionKeys];
}
