import { useMemo } from "react";
import { KeepAliveStackViewport } from "../../../components/keep-alive-stack/keep-alive-stack-viewport";
import { useKeepAliveStack } from "../../../components/keep-alive-stack/use-keep-alive-stack";
import {
  PresetDraftSessionsProvider,
  useRetainPresetDraftSessions,
} from "../hooks/use-preset-draft-sessions";
import { PresetPageRenderer } from "./preset-page-renderer";
import { presetListPage, type PresetPage } from "./preset-pages";

export function PresetManager({ onBack }: { onBack: () => void }) {
  const { pages, activePage, pushPage, popPage, replacePage } =
    useKeepAliveStack(presetListPage);
  const retainedSessionKeys = useMemo(() => presetDraftSessionKeys(pages), [pages]);

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <PresetDraftSessionsProvider>
        <PresetDraftSessionRetainer sessionKeys={retainedSessionKeys} />
        <KeepAliveStackViewport
          activeKey={activePage.key}
          pages={pages}
          renderPage={(page) => (
            <PresetPageRenderer
              page={page}
              popPage={popPage}
              pushPage={pushPage}
              replacePage={replacePage}
              onRootBack={onBack}
            />
          )}
        />
      </PresetDraftSessionsProvider>
    </main>
  );
}

function PresetDraftSessionRetainer({
  sessionKeys,
}: {
  sessionKeys: string[];
}) {
  useRetainPresetDraftSessions(sessionKeys);
  return null;
}

function presetDraftSessionKeys(pages: PresetPage[]): string[] {
  const sessionKeys = new Set<string>();

  for (const page of pages) {
    if (
      page.name === "create" ||
      page.name === "editMain" ||
      page.name === "promptList" ||
      page.name === "entryCreate" ||
      page.name === "entryEdit"
    ) {
      sessionKeys.add(page.sessionKey);
    }
  }

  return [...sessionKeys];
}
