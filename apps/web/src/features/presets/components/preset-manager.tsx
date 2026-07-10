import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { KeepAliveStackViewport } from "../../../components/keep-alive-stack/keep-alive-stack-viewport";
import { useKeepAliveStack } from "../../../components/keep-alive-stack/use-keep-alive-stack";
import { getFormErrorMessage } from "../../../lib/forms/form-error";
import { notify } from "../../../lib/notifications/notify";
import {
  PresetDraftSessionsProvider,
  usePresetDraftSession,
  useRetainPresetDraftSessions,
} from "../hooks/use-preset-draft-sessions";
import { PresetPageRenderer } from "./preset-page-renderer";
import { presetListPage, type PresetPage } from "./preset-pages";

export function PresetManager({ onBack }: { onBack: () => void }) {
  const { pages, activePage, pushPage, popPage, replacePage } =
    useKeepAliveStack(presetListPage);
  const retainedSessionKeys = useMemo(
    () => presetDraftSessionKeys(pages),
    [pages],
  );

  return (
    <main className="flex h-dvh max-h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
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
        {isPresetSavePage(activePage) ? (
          <PresetSharedSaveBar page={activePage} />
        ) : null}
      </PresetDraftSessionsProvider>
    </main>
  );
}

type PresetSavePage = Extract<
  PresetPage,
  { name: "editMain" | "promptList" | "entryEdit" }
>;

function PresetSharedSaveBar({ page }: { page: PresetSavePage }) {
  const { t } = useTranslation();
  const { document, isDirty, isPending, loadError, saveDocument } =
    usePresetDraftSession({
      sessionKey: page.sessionKey,
      presetId: page.presetId,
    });

  useEffect(() => {
    if (loadError) {
      notify.error({ title: getFormErrorMessage(loadError) });
    }
  }, [loadError]);

  function saveActiveDraft() {
    if (page.name === "entryEdit") {
      const entry = document.entries.find(
        (candidate) => candidate.id === page.entryId,
      );

      if (!entry?.name.trim()) {
        notify.error({ title: t("presets.entries.errors.nameRequired") });
        return;
      }
    }

    saveDocument();
  }

  return (
    <div className="shrink-0 border-t border-border bg-background px-4 py-3">
      <div className="mx-auto w-full max-w-2xl">
        <Button
          className="w-full"
          disabled={isPending || !isDirty}
          type="button"
          onClick={saveActiveDraft}
        >
          {t("presets.editor.saveSubmit")}
        </Button>
      </div>
    </div>
  );
}

function isPresetSavePage(page: PresetPage): page is PresetSavePage {
  return (
    page.name === "editMain" ||
    page.name === "promptList" ||
    page.name === "entryEdit"
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
