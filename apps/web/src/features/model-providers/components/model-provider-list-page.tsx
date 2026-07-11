import { KeyRound, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { ModelProviderListPanel } from "./model-provider-list-panel";
import { ModelProviderStackPage } from "./model-provider-stack-page";

export function ModelProviderListPage({
  onBack,
  onCreate,
  onManageApiKeys,
  onSelectConfig,
}: {
  onBack: () => void;
  onCreate: () => void;
  onManageApiKeys: () => void;
  onSelectConfig: (configId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <ModelProviderStackPage>
      <MobileTopBar
        actions={
          <>
            <IconAction
              label={t("modelProviders.apiKeys.manageAction")}
              onClick={onManageApiKeys}
            >
              <KeyRound aria-hidden="true" />
            </IconAction>
            <IconAction label={t("modelProviders.list.createAction")} onClick={onCreate}>
              <Plus aria-hidden="true" />
            </IconAction>
          </>
        }
        title={t("modelProviders.list.title")}
        onBack={onBack}
      />
      <ModelProviderListPanel onSelectConfig={onSelectConfig} />
    </ModelProviderStackPage>
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
