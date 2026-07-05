import { countPromptTokens } from "@rolesta/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  createPresetEntry,
  deletePresetEntry,
  getPreset,
  updatePresetEntry,
  type PresetEntryPosition,
  type PresetEntryRole,
} from "../api/presets-api";
import {
  emptyPresetEntryEditorForm,
  presetEntryEditorFormFromEntry,
  presetEntryValuesFromForm,
  type PresetEntryEditorFormState,
} from "../model/preset-editor-form";
import {
  FormError,
  FormSubmitButton,
  PresetSelectField,
  PresetTextAreaField,
  PresetTextField,
} from "./preset-form-fields";

export function PresetEntryEditor({
  presetId,
  entryId,
  submitLabel,
  onSaved,
}: {
  presetId: string;
  entryId?: string;
  submitLabel: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PresetEntryEditorFormState>(
    emptyPresetEntryEditorForm,
  );
  const [visibleError, setVisibleError] = useState<string | null>(null);
  const presetQuery = useQuery({
    enabled: Boolean(entryId),
    queryKey: ["preset", presetId],
    queryFn: () => getPreset(presetId),
  });
  const entry = presetQuery.data?.entries.find((candidate) => candidate.id === entryId);
  const roleOptions: Array<{ value: PresetEntryRole; label: string }> = [
    { value: "system", label: t("presets.entries.roles.system") },
    { value: "user", label: t("presets.entries.roles.user") },
    { value: "assistant", label: t("presets.entries.roles.assistant") },
  ];
  const positionOptions: Array<{ value: PresetEntryPosition; label: string }> = [
    { value: "system", label: t("presets.entries.positions.system") },
    { value: "chat", label: t("presets.entries.positions.chat") },
    { value: "preHistory", label: t("presets.entries.positions.preHistory") },
    { value: "postHistory", label: t("presets.entries.positions.postHistory") },
    { value: "unknown", label: t("presets.entries.positions.unknown") },
  ];

  useEffect(() => {
    if (entry) {
      setForm(presetEntryEditorFormFromEntry(entry));
    }
  }, [entry]);

  const saveMutation = useMutation({
    mutationFn: () =>
      entryId
        ? updatePresetEntry(presetId, entryId, presetEntryValuesFromForm(form))
        : createPresetEntry(presetId, presetEntryValuesFromForm(form)),
    async onSuccess(preset) {
      await queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.setQueryData(["preset", preset.id], preset);
      onSaved();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deletePresetEntry(presetId, entryId!),
    async onSuccess(preset) {
      await queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.setQueryData(["preset", preset.id], preset);
      onSaved();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVisibleError(null);

    if (!form.name.trim()) {
      setVisibleError(t("presets.entries.errors.nameRequired"));
      return;
    }

    saveMutation.mutate();
  }

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={submit}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <PresetTextField
            disabled={saveMutation.isPending}
            id={`${fieldPrefix}-name`}
            label={t("presets.entries.fields.name")}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <PresetSelectField
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-role`}
              label={t("presets.entries.fields.role")}
              options={roleOptions}
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
            />
            <PresetSelectField
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-position`}
              label={t("presets.entries.fields.position")}
              options={positionOptions}
              value={form.position}
              onChange={(position) => setForm({ ...form, position })}
            />
          </div>
          <PresetTextAreaField
            disabled={saveMutation.isPending}
            id={`${fieldPrefix}-content`}
            label={t("presets.entries.fields.content")}
            rows={14}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
          />
          <div className="rounded-md border border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              {t("presets.metrics.tokenCount")}{" "}
            </span>
            <span className="font-semibold tabular-nums">
              {countPromptTokens(form.content).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        {visibleError || saveMutation.isError ? (
          <FormError>
            {visibleError ?? t("presets.entries.errors.saveFailed")}
          </FormError>
        ) : null}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <FormSubmitButton disabled={saveMutation.isPending}>
            {submitLabel}
          </FormSubmitButton>
          {entryId ? (
            <Button
              aria-label={t("presets.entries.deleteAction")}
              disabled={deleteMutation.isPending}
              size="icon-lg"
              type="button"
              variant="outline"
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
