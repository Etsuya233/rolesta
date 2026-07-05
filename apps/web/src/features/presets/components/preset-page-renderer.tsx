import { PresetCreatePage } from "./preset-create-page";
import { PresetEditPage } from "./preset-edit-page";
import { PresetEntryCreatePage } from "./preset-entry-create-page";
import { PresetEntryEditPage } from "./preset-entry-edit-page";
import { PresetImportPage } from "./preset-import-page";
import { PresetListPage } from "./preset-list-page";
import { PresetPromptListPage } from "./preset-prompt-list-page";
import {
  createPresetPage,
  editPresetPage,
  importPresetPage,
  type PresetPage,
} from "./preset-pages";

export function PresetPageRenderer({
  page,
  onRootBack,
  popPage,
  pushPage,
  replacePage,
}: {
  page: PresetPage;
  onRootBack: () => void;
  popPage: () => void;
  pushPage: (page: PresetPage) => void;
  replacePage: (page: PresetPage) => void;
}) {
  if (page.name === "list") {
    return (
      <PresetListPage
        onBack={onRootBack}
        onCreate={() => pushPage(createPresetPage())}
        onImport={() => pushPage(importPresetPage())}
        onSelectPreset={(presetId) => pushPage(editPresetPage(presetId))}
      />
    );
  }

  if (page.name === "create") {
    return (
      <PresetCreatePage page={page} replacePage={replacePage} onBack={popPage} />
    );
  }

  if (page.name === "editMain") {
    return <PresetEditPage page={page} pushPage={pushPage} onBack={popPage} />;
  }

  if (page.name === "promptList") {
    return (
      <PresetPromptListPage page={page} pushPage={pushPage} onBack={popPage} />
    );
  }

  if (page.name === "entryCreate") {
    return <PresetEntryCreatePage page={page} onBack={popPage} />;
  }

  if (page.name === "entryEdit") {
    return <PresetEntryEditPage page={page} onBack={popPage} />;
  }

  return <PresetImportPage replacePage={replacePage} onBack={popPage} />;
}
