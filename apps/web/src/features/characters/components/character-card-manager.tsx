import { useMemo } from "react";
import { KeepAliveStackViewport } from "../../../components/keep-alive-stack/keep-alive-stack-viewport";
import { useKeepAliveStack } from "../../../components/keep-alive-stack/use-keep-alive-stack";
import {
  CharacterDraftSessionsProvider,
  useRetainCharacterDraftSessions,
} from "../hooks/use-character-draft-sessions";
import { CharacterPageRenderer } from "./character-page-renderer";
import { characterListPage, type CharacterPage } from "./character-pages";

export interface CharacterCardManagerProps {
  onBack: () => void;
}

export function CharacterCardManager({ onBack }: CharacterCardManagerProps) {
  const { pages, activePage, pushPage, popPage, replacePage } =
    useKeepAliveStack(characterListPage);
  const retainedSessionKeys = useMemo(
    () => characterDraftSessionKeys(pages),
    [pages],
  );

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <CharacterDraftSessionsProvider>
        <CharacterDraftSessionRetainer sessionKeys={retainedSessionKeys} />
        <KeepAliveStackViewport
          activeKey={activePage.key}
          pages={pages}
          renderPage={(page) => (
            <CharacterPageRenderer
              page={page}
              popPage={popPage}
              pushPage={pushPage}
              replacePage={replacePage}
              onRootBack={onBack}
            />
          )}
        />
      </CharacterDraftSessionsProvider>
    </main>
  );
}

function CharacterDraftSessionRetainer({
  sessionKeys,
}: {
  sessionKeys: string[];
}) {
  useRetainCharacterDraftSessions(sessionKeys);
  return null;
}

function characterDraftSessionKeys(pages: CharacterPage[]): string[] {
  const sessionKeys = new Set<string>();

  for (const page of pages) {
    if (
      page.name === "create" ||
      page.name === "editMain" ||
      page.name === "alternateGreetings"
    ) {
      sessionKeys.add(page.sessionKey);
    }
  }

  return [...sessionKeys];
}
