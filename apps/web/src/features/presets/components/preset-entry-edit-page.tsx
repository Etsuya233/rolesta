import { useTranslation } from "react-i18next";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
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

  return (
    <PresetStackPage>
      <MobileTopBar title={t("presets.entries.editTitle")} onBack={onBack} />
      <PresetEntryEditor
        entryId={page.entryId}
        presetId={page.presetId}
        submitLabel={t("presets.entries.saveSubmit")}
        onSaved={onBack}
      />
    </PresetStackPage>
  );
}
