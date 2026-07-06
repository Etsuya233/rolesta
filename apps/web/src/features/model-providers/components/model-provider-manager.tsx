import { useMemo } from "react";
import { KeepAliveStackViewport } from "../../../components/keep-alive-stack/keep-alive-stack-viewport";
import { useKeepAliveStack } from "../../../components/keep-alive-stack/use-keep-alive-stack";
import {
  ModelProviderDraftSessionsProvider,
  useRetainModelProviderDraftSessions,
} from "../hooks/use-model-provider-draft-sessions";
import { ModelProviderPageRenderer } from "./model-provider-page-renderer";
import {
  modelProviderListPage,
  type ModelProviderPage,
} from "./model-provider-pages";

export function ModelProviderManager({ onBack }: { onBack: () => void }) {
  const { pages, activePage, pushPage, popPage, replacePage } =
    useKeepAliveStack(modelProviderListPage);
  const retainedSessionKeys = useMemo(
    () => modelProviderDraftSessionKeys(pages),
    [pages],
  );

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <ModelProviderDraftSessionsProvider>
        <ModelProviderDraftSessionRetainer sessionKeys={retainedSessionKeys} />
        <KeepAliveStackViewport
          activeKey={activePage.key}
          pages={pages}
          renderPage={(page) => (
            <ModelProviderPageRenderer
              page={page}
              popPage={popPage}
              pushPage={pushPage}
              replacePage={replacePage}
              onRootBack={onBack}
            />
          )}
        />
      </ModelProviderDraftSessionsProvider>
    </main>
  );
}

function ModelProviderDraftSessionRetainer({
  sessionKeys,
}: {
  sessionKeys: string[];
}) {
  useRetainModelProviderDraftSessions(sessionKeys);
  return null;
}

function modelProviderDraftSessionKeys(pages: ModelProviderPage[]): string[] {
  const sessionKeys = new Set<string>();

  for (const page of pages) {
    if (page.name === "create" || page.name === "edit" || page.name === "apiKeys") {
      sessionKeys.add(page.sessionKey);
    }
  }

  return [...sessionKeys];
}
