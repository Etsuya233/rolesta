import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { useWorldbookDraftSession } from "../hooks/use-worldbook-draft-sessions";
import { WorldbookEntryEditor } from "./worldbook-entry-editor";
import type { WorldbookPage } from "./worldbook-pages";
import { WorldbookStackPage } from "./worldbook-stack-page";

export function WorldbookEntryEditPage({
  page,
  onBack,
}: {
  page: Extract<WorldbookPage, { name: "entryEdit" }>;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { document, isPending, saveDocument } = useWorldbookDraftSession({
    sessionKey: page.sessionKey,
    worldbookId: page.worldbookId,
  });

  function deleteEntry() {
    saveDocument(
      {
        ...document,
        entries: document.entries.filter(
          (candidate) => candidate.id !== page.entryId,
        ),
      },
      onBack,
    );
  }

  return (
    <WorldbookStackPage>
      <MobileTopBar
        actions={
          <Button
            aria-label={t("worldbooks.entries.deleteAction")}
            className="size-10"
            disabled={isPending}
            size="icon-lg"
            type="button"
            variant="ghost"
            onClick={deleteEntry}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        }
        title={t("worldbooks.entries.editTitle")}
        onBack={onBack}
      />
      <WorldbookEntryEditor
        entryId={page.entryId}
        sessionKey={page.sessionKey}
        worldbookId={page.worldbookId}
      />
    </WorldbookStackPage>
  );
}
