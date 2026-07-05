import { useTranslation } from "react-i18next";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { PresetPromptListEditor } from "./preset-prompt-list-editor";
import {
  presetEntryCreatePage,
  presetEntryEditPage,
  type PresetPage,
} from "./preset-pages";
import { PresetStackPage } from "./preset-stack-page";

export function PresetPromptListPage({
  page,
  pushPage,
  onBack,
}: {
  page: Extract<PresetPage, { name: "promptList" }>;
  pushPage: (page: PresetPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <PresetStackPage>
      <MobileTopBar title={t("presets.promptList.title")} onBack={onBack} />
      <PresetPromptListEditor
        presetId={page.presetId}
        onCreateEntry={() =>
          pushPage(presetEntryCreatePage(page.presetId, page.sessionKey))
        }
        onEditEntry={(entryId) =>
          pushPage(presetEntryEditPage(page.presetId, entryId, page.sessionKey))
        }
      />
    </PresetStackPage>
  );
}
