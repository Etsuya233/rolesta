import { Import, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { PresetListPanel } from "./preset-list-panel";
import { PresetStackPage } from "./preset-stack-page";

export function PresetListPage({
  onBack,
  onCreate,
  onImport,
  onSelectPreset,
}: {
  onBack: () => void;
  onCreate: () => void;
  onImport: () => void;
  onSelectPreset: (presetId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <PresetStackPage>
      <MobileTopBar
        actions={
          <>
            <IconAction label={t("presets.list.importAction")} onClick={onImport}>
              <Import aria-hidden="true" />
            </IconAction>
            <IconAction label={t("presets.list.createAction")} onClick={onCreate}>
              <Plus aria-hidden="true" />
            </IconAction>
          </>
        }
        title={t("presets.list.title")}
        onBack={onBack}
      />
      <PresetListPanel onSelectPreset={onSelectPreset} />
    </PresetStackPage>
  );
}

function IconAction({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className="size-10"
      size="icon-lg"
      type="button"
      variant="ghost"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
