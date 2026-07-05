import { FileJson } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { MobileFormSection } from "../../assets/components/mobile-form-section";
import { importCharacterCard } from "../api/characters-api";
import { FormError, FormSubmitButton } from "./character-form-fields";

export interface CharacterImportPanelProps {
  onImported: (characterId: string) => void;
}

export function CharacterImportPanel({
  onImported,
}: CharacterImportPanelProps) {
  const fileInputId = useId();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!file) {
      setErrorMessage("请选择角色卡文件");
      return;
    }

    importMutation.mutate(file);
  }

  const visibleError =
    errorMessage ?? (importMutation.isError ? "导入角色卡失败" : null);

  return (
    <form
      className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto"
      onSubmit={handleSubmit}
    >
      <MobileFormSection title="选择文件">
        <label
          className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border px-4 py-8 text-center transition-colors hover:bg-muted/50"
          htmlFor={fileInputId}
        >
          <FileJson
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
          <span className="text-sm font-medium">
            {file ? file.name : "选择 JSON 或 PNG 角色卡"}
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
          确认导入
        </FormSubmitButton>
      </div>
    </form>
  );
}
