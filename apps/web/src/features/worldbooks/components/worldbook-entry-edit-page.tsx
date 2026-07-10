import { useTranslation } from "react-i18next";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
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

  return (
    <WorldbookStackPage>
      <MobileTopBar title={t("worldbooks.entries.editTitle")} onBack={onBack} />
      <WorldbookEntryEditor
        entryId={page.entryId}
        sessionKey={page.sessionKey}
        worldbookId={page.worldbookId}
        submitLabel={t("worldbooks.savePreset")}
        onDeleted={onBack}
      />
    </WorldbookStackPage>
  );
}
