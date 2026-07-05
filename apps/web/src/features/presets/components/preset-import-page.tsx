import { useTranslation } from "react-i18next";
import { usePresetDraftSessionActions } from "../hooks/use-preset-draft-sessions";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { PresetImportPanel } from "./preset-import-panel";
import {
  editPresetPage,
  presetSessionKey,
  type PresetPage,
} from "./preset-pages";
import { PresetStackPage } from "./preset-stack-page";

export function PresetImportPage({
  replacePage,
  onBack,
}: {
  replacePage: (page: PresetPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { moveSessionToPreset } = usePresetDraftSessionActions();

  return (
    <PresetStackPage>
      <MobileTopBar title={t("presets.import.title")} onBack={onBack} />
      <PresetImportPanel
        onImported={(preset) => {
          moveSessionToPreset("presets:import", presetSessionKey(preset.id), preset);
          replacePage(editPresetPage(preset.id));
        }}
      />
    </PresetStackPage>
  );
}
