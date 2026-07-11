import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { deleteModelProvider } from "../api/model-providers-api";
import { ModelProviderMainEditor } from "./model-provider-main-editor";
import type { ModelProviderPage } from "./model-provider-pages";
import { ModelProviderStackPage } from "./model-provider-stack-page";

export function ModelProviderEditPage({
  page,
  onBack,
  onManageApiKeys,
}: {
  page: Extract<ModelProviderPage, { name: "edit" }>;
  onBack: () => void;
  onManageApiKeys: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => deleteModelProvider(page.configId),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ["model-providers"] });
      onBack();
    },
  });

  return (
    <ModelProviderStackPage>
      <MobileTopBar
        actions={
          <>
            <Button
              aria-label={t("modelProviders.editor.deleteAction")}
              className="size-10"
              disabled={deleteMutation.isPending}
              size="icon-lg"
              type="button"
              variant="ghost"
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </>
        }
        title={t("modelProviders.editor.editTitle")}
        onBack={onBack}
      />
      <ModelProviderMainEditor
        configId={page.configId}
        sessionKey={page.sessionKey}
        submitLabel={t("modelProviders.editor.saveSubmit")}
        onManageApiKeys={onManageApiKeys}
      />
    </ModelProviderStackPage>
  );
}
