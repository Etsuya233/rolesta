import { FileJson } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { MobileFormSection } from "../../assets/components/mobile-form-section";
import { importCharacterCard } from "../api/characters-api";
import { FormError, FormSubmitButton } from "./character-form-fields";

export interface CharacterImportPanelProps {
  onImported: (characterId: string) => void;
}

export function CharacterImportPanel({
  onImported,
}: CharacterImportPanelProps) {
  const { t } = useTranslation();
  const fileInputId = useId();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isFileMissing, setIsFileMissing] = useState(false);

  const importMutation = useMutation({
    mutationFn: (selectedFile: File) => importCharacterCard(selectedFile),
    async onSuccess(character) {
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.setQueryData(["character", character.id], character);
      onImported(character.id);
    },
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setIsFileMissing(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsFileMissing(false);

    if (!file) {
      setIsFileMissing(true);
      return;
    }

    importMutation.mutate(file);
  }

  let visibleError: string | null = null;

  if (isFileMissing) {
    visibleError = t("characters.import.fileRequired");
  } else if (importMutation.isError) {
    visibleError = t("characters.import.failed");
  }

  return (
    <form
      className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto"
      onSubmit={handleSubmit}
    >
      <MobileFormSection title={t("characters.import.fileSectionTitle")}>
        <label
          className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border px-4 py-8 text-center transition-colors hover:bg-muted/50"
          htmlFor={fileInputId}
        >
          <FileJson
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
          <span className="text-sm font-medium">
            {file ? file.name : t("characters.import.chooseFile")}
          </span>
          <input
            accept=".json,.png,application/json,image/png"
            className="sr-only"
            disabled={importMutation.isPending}
            id={fileInputId}
            type="file"
            onChange={handleFileChange}
          />
        </label>
      </MobileFormSection>

      <div className="flex flex-col gap-3 px-4 pb-6">
        {visibleError ? <FormError>{visibleError}</FormError> : null}
        <FormSubmitButton disabled={importMutation.isPending}>
          {t("characters.import.submit")}
        </FormSubmitButton>
      </div>
    </form>
  );
}
