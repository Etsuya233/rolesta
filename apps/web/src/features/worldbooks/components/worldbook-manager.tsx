import { useMemo } from "react";
import { KeepAliveStackViewport } from "../../../components/keep-alive-stack/keep-alive-stack-viewport";
import { useKeepAliveStack } from "../../../components/keep-alive-stack/use-keep-alive-stack";
import {
  WorldbookDraftSessionsProvider,
  useRetainWorldbookDraftSessions,
} from "../hooks/use-worldbook-draft-sessions";
import { WorldbookPageRenderer } from "./worldbook-page-renderer";
import { worldbookListPage, type WorldbookPage } from "./worldbook-pages";

export function WorldbookManager({ onBack }: { onBack: () => void }) {
  const { pages, activePage, pushPage, popPage, replacePage } =
    useKeepAliveStack(worldbookListPage);
  const retainedSessionKeys = useMemo(
    () => worldbookDraftSessionKeys(pages),
    [pages],
  );

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
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
      </WorldbookDraftSessionsProvider>
    </main>
  );
}

function WorldbookDraftSessionRetainer({
  sessionKeys,
}: {
  sessionKeys: string[];
}) {
  useRetainWorldbookDraftSessions(sessionKeys);
  return null;
}

function worldbookDraftSessionKeys(pages: WorldbookPage[]): string[] {
  const sessionKeys = new Set<string>();

  for (const page of pages) {
    if (
      page.name === "create" ||
      page.name === "editMain" ||
      page.name === "entryList" ||
      page.name === "entryCreate" ||
      page.name === "entryEdit"
    ) {
      sessionKeys.add(page.sessionKey);
    }
  }

  return [...sessionKeys];
}
