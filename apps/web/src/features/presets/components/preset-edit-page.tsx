import { Download, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { deletePreset, exportPreset } from "../api/presets-api";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { PresetMainEditor } from "./preset-main-editor";
import {
  presetPromptListPage,
  type PresetPage,
} from "./preset-pages";
import { PresetStackPage } from "./preset-stack-page";

export function PresetEditPage({
  page,
  pushPage,
  onBack,
}: {
  page: Extract<PresetPage, { name: "editMain" }>;
  pushPage: (page: PresetPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => deletePreset(page.presetId),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ["presets"] });
      onBack();
    },
  });

  return (
    <PresetStackPage>
      <MobileTopBar
        actions={
          <>
            <Button
              aria-label={t("presets.editor.exportAction")}
              className="size-10"
              size="icon-lg"
              type="button"
              variant="ghost"
              onClick={() => void downloadPreset(page.presetId)}
            >
              <Download aria-hidden="true" />
            </Button>
            <Button
              aria-label={t("presets.editor.deleteAction")}
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
        title={t("presets.editor.editTitle")}
        onBack={onBack}
      />
      <PresetMainEditor
        presetId={page.presetId}
        sessionKey={page.sessionKey}
        onOpenPromptList={() =>
          pushPage(presetPromptListPage(page.presetId, page.sessionKey))
        }
      />
    </PresetStackPage>
  );
}

async function downloadPreset(presetId: string) {
  const blob = await exportPreset(presetId);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `preset-${presetId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
