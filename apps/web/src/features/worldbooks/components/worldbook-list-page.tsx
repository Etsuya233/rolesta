import { Import, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { WorldbookListPanel } from "./worldbook-list-panel";
import { WorldbookStackPage } from "./worldbook-stack-page";

export function WorldbookListPage({
  onBack,
  onCreate,
  onImport,
  onSelectWorldbook,
}: {
  onBack: () => void;
  onCreate: () => void;
  onImport: () => void;
  onSelectWorldbook: (worldbookId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <WorldbookStackPage>
      <MobileTopBar
        actions={
          <>
            <IconAction
              label={t("worldbooks.list.importAction")}
              onClick={onImport}
            >
              <Import aria-hidden="true" />
            </IconAction>
            <IconAction
              label={t("worldbooks.list.createAction")}
              onClick={onCreate}
            >
              <Plus aria-hidden="true" />
            </IconAction>
          </>
        }
        title={t("worldbooks.list.title")}
        onBack={onBack}
      />
      <WorldbookListPanel onSelectWorldbook={onSelectWorldbook} />
    </WorldbookStackPage>
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
