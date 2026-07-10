import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { getFormErrorMessage } from "../../../lib/forms/form-error";
import { notify } from "../../../lib/notifications/notify";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { deleteWorldbook, exportWorldbook } from "../api/worldbooks-api";
import { WorldbookMainEditor } from "./worldbook-main-editor";
import { type WorldbookPage, worldbookEntryListPage } from "./worldbook-pages";
import { WorldbookStackPage } from "./worldbook-stack-page";

export function WorldbookEditPage({
  page,
  pushPage,
  onBack,
}: {
  page: Extract<WorldbookPage, { name: "editMain" }>;
  pushPage: (page: WorldbookPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => deleteWorldbook(page.worldbookId),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      onBack();
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });

  async function handleExport() {
    try {
      await downloadWorldbook(page.worldbookId);
    } catch (error) {
      notify.error({ title: getFormErrorMessage(error) });
    }
  }

  return (
    <WorldbookStackPage>
      <MobileTopBar
        actions={
          <>
            <Button
              aria-label={t("worldbooks.editor.exportAction")}
              className="size-10"
              size="icon-lg"
              type="button"
              variant="ghost"
              onClick={() => void handleExport()}
            >
              <Download aria-hidden="true" />
            </Button>
            <Button
              aria-label={t("worldbooks.editor.deleteAction")}
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
        title={t("worldbooks.editor.editTitle")}
        onBack={onBack}
      />
      <WorldbookMainEditor
        worldbookId={page.worldbookId}
        sessionKey={page.sessionKey}
        onOpenEntries={() =>
          pushPage(worldbookEntryListPage(page.worldbookId, page.sessionKey))
        }
      />
    </WorldbookStackPage>
  );
}

async function downloadWorldbook(worldbookId: string) {
  const blob = await exportWorldbook(worldbookId);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `worldbook-${worldbookId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
