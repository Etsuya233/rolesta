import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import {
  importWorldbook,
  type WorldbookDetailResponse,
} from "../api/worldbooks-api";
import { useWorldbookDraftSessionActions } from "../hooks/use-worldbook-draft-sessions";
import {
  editWorldbookPage,
  type WorldbookPage,
  worldbookSessionKey,
} from "./worldbook-pages";
import { WorldbookStackPage } from "./worldbook-stack-page";
import { FormError } from "./worldbook-form-fields";

export function WorldbookImportPage({
  replacePage,
  onBack,
}: {
  replacePage: (page: WorldbookPage) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { moveSessionToWorldbook } = useWorldbookDraftSessionActions();
  const [file, setFile] = useState<File | null>(null);
  const [visibleError, setVisibleError] = useState<string | null>(null);
  const importMutation = useMutation({
    mutationFn: (selectedFile: File) => importWorldbook(selectedFile),
    async onSuccess(worldbook) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(["worldbook", worldbook.id], worldbook);
      moveImportedSession(worldbook);
    },
  });

  function moveImportedSession(worldbook: WorldbookDetailResponse) {
    moveSessionToWorldbook(
      "worldbooks:import",
      worldbookSessionKey(worldbook.id),
      worldbook,
    );
    replacePage(editWorldbookPage(worldbook.id));
  }

  function submit() {
    setVisibleError(null);

    if (!file) {
      setVisibleError(t("worldbooks.import.fileRequired"));
      return;
    }

    importMutation.mutate(file);
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  return (
    <WorldbookStackPage>
      <MobileTopBar title={t("worldbooks.import.title")} onBack={onBack} />
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer flex-col gap-2 rounded-md border border-dashed border-border p-4 text-sm hover:bg-accent">
              <span className="font-medium">
                {t("worldbooks.import.chooseFile")}
              </span>
              <span className="text-muted-foreground">
                {file ? file.name : t("worldbooks.import.noFile")}
              </span>
              <input
                accept="application/json,.json"
                className="sr-only"
                type="file"
                onChange={selectFile}
              />
            </label>
            {importMutation.isError || visibleError ? (
              <FormError>
                {visibleError ?? t("worldbooks.import.failed")}
              </FormError>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 border-t border-border p-3">
          <Button
            className="w-full"
            disabled={importMutation.isPending}
            type="button"
            onClick={submit}
          >
            <Upload aria-hidden="true" />
            {t("worldbooks.import.submit")}
          </Button>
        </div>
      </div>
    </WorldbookStackPage>
  );
}
