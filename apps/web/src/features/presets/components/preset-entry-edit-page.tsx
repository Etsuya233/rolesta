import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { usePresetDraftSession } from "../hooks/use-preset-draft-sessions";
import { PresetEntryEditor } from "./preset-entry-editor";
import type { PresetPage } from "./preset-pages";
import { PresetStackPage } from "./preset-stack-page";

export function PresetEntryEditPage({
  page,
  onBack,
}: {
  page: Extract<PresetPage, { name: "entryEdit" }>;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { document, isPending, saveDocument } = usePresetDraftSession({
    presetId: page.presetId,
    sessionKey: page.sessionKey,
  });

  function deleteEntry() {
    saveDocument(
      {
        ...document,
        entries: document.entries.filter(
          (candidate) => candidate.id !== page.entryId,
        ),
        promptItems: document.promptItems.filter(
          (item) => item.entryId !== page.entryId,
        ),
      },
      onBack,
    );
  }

  return (
    <PresetStackPage>
      <MobileTopBar
        actions={
          <Button
            aria-label={t("presets.entries.deleteAction")}
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
        title={t("presets.entries.editTitle")}
        onBack={onBack}
      />
      <PresetEntryEditor
        entryId={page.entryId}
        presetId={page.presetId}
        sessionKey={page.sessionKey}
      />
    </PresetStackPage>
  );
}
