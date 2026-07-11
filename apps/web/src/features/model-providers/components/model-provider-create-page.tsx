import { useTranslation } from "react-i18next";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { useModelProviderDraftSessionActions } from "../hooks/use-model-provider-draft-sessions";
import { ModelProviderMainEditor } from "./model-provider-main-editor";
import {
  editModelProviderPage,
  modelProviderSessionKey,
  type ModelProviderPage,
} from "./model-provider-pages";
import { ModelProviderStackPage } from "./model-provider-stack-page";

export function ModelProviderCreatePage({
  page,
  replacePage,
  onBack,
  onManageApiKeys,
}: {
  page: Extract<ModelProviderPage, { name: "create" }>;
  replacePage: (page: ModelProviderPage) => void;
  onBack: () => void;
  onManageApiKeys: () => void;
}) {
  const { t } = useTranslation();
  const { moveSessionToConfig } = useModelProviderDraftSessionActions();

  return (
    <ModelProviderStackPage>
      <MobileTopBar
        title={t("modelProviders.editor.createTitle")}
        onBack={onBack}
      />
      <ModelProviderMainEditor
        sessionKey={page.sessionKey}
        submitLabel={t("modelProviders.editor.createSubmit")}
        onManageApiKeys={onManageApiKeys}
        onCreated={(config) => {
          moveSessionToConfig(
            page.sessionKey,
            modelProviderSessionKey(config.id),
            config,
          );
          replacePage(editModelProviderPage(config.id));
        }}
      />
    </ModelProviderStackPage>
  );
}
