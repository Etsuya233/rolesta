import { countPromptTokens } from "@rolesta/shared";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../lib/notifications/notify";
import type { PresetEntryPosition, PresetEntryRole } from "../api/presets-api";
import { usePresetDraftSession } from "../hooks/use-preset-draft-sessions";
import {
  emptyPresetEntryEditorForm,
  presetEntryEditorFormFromEntry,
  presetEntryValuesFromForm,
  type PresetEntryEditorFormState,
} from "../model/preset-editor-form";
import {
  FormSubmitButton,
  PresetSelectField,
  PresetTextAreaField,
  PresetTextField,
} from "./preset-form-fields";

export function PresetEntryEditor({
  presetId,
  sessionKey,
  entryId,
  submitLabel,
  onSaved,
}: {
  presetId: string;
  sessionKey: string;
  entryId?: string;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const {
    document,
    setDocument,
    isDirty,
    isPending,
    saveDocument,
  } = usePresetDraftSession({
    presetId,
    sessionKey,
  });
  const entry = document.entries.find((candidate) => candidate.id === entryId);
  const [form, setForm] = useState<PresetEntryEditorFormState>(() =>
    entry ? presetEntryEditorFormFromEntry(entry) : emptyPresetEntryEditorForm,
  );
  const roleOptions: Array<{ value: PresetEntryRole; label: string }> = [
    { value: "system", label: t("presets.entries.roles.system") },
    { value: "user", label: t("presets.entries.roles.user") },
    { value: "assistant", label: t("presets.entries.roles.assistant") },
  ];
  const positionOptions: Array<{
    value: PresetEntryPosition;
    label: string;
  }> = [
    { value: "system", label: t("presets.entries.positions.system") },
    { value: "chat", label: t("presets.entries.positions.chat") },
    { value: "preHistory", label: t("presets.entries.positions.preHistory") },
    { value: "postHistory", label: t("presets.entries.positions.postHistory") },
    { value: "unknown", label: t("presets.entries.positions.unknown") },
  ];
  const entryValues = presetEntryValuesFromForm(form);
  const entryChanged = entry
    ? entry.name !== entryValues.name ||
      entry.role !== entryValues.role ||
      entry.position !== entryValues.position ||
      entry.content !== entryValues.content
    : form.name.trim().length > 0 || form.content.length > 0;

  useEffect(() => {
    if (entry) {
      setForm(presetEntryEditorFormFromEntry(entry));
    }
  }, [entry]);

  function updateForm(nextForm: PresetEntryEditorFormState) {
    setForm(nextForm);

    if (!entryId || !entry) {
      return;
    }

    const nextEntry = {
      id: entryId,
      ...presetEntryValuesFromForm(nextForm),
    };
    setDocument((current) => ({
      ...current,
      entries: current.entries.map((candidate) =>
        candidate.id === entryId ? nextEntry : candidate,
      ),
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      notify.error({ title: t("presets.entries.errors.nameRequired") });
      return;
    }

    const values = presetEntryValuesFromForm(form);
    const id = entryId ?? crypto.randomUUID();
    const entries = entryId
      ? document.entries.map((candidate) =>
          candidate.id === entryId ? { id, ...values } : candidate,
        )
      : [...document.entries, { id, ...values }];
    const promptItems = entryId
      ? document.promptItems
      : [...document.promptItems, { entryId: id, enabled: true }];

    saveDocument({ ...document, entries, promptItems }, onSaved);
  }

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={submit}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <PresetTextField
            disabled={isPending}
            id={`${fieldPrefix}-name`}
            label={t("presets.entries.fields.name")}
            value={form.name}
            onChange={(event) =>
              updateForm({ ...form, name: event.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <PresetSelectField
              disabled={isPending}
              id={`${fieldPrefix}-role`}
              label={t("presets.entries.fields.role")}
              options={roleOptions}
              value={form.role}
              onChange={(role) => updateForm({ ...form, role })}
            />
            <PresetSelectField
              disabled={isPending}
              id={`${fieldPrefix}-position`}
              label={t("presets.entries.fields.position")}
              options={positionOptions}
              value={form.position}
              onChange={(position) => updateForm({ ...form, position })}
            />
          </div>
          <PresetTextAreaField
            disabled={isPending}
            id={`${fieldPrefix}-content`}
            label={t("presets.entries.fields.content")}
            rows={14}
            value={form.content}
            onChange={(event) =>
              updateForm({ ...form, content: event.target.value })
            }
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

      {submitLabel ? (
        <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
          <FormSubmitButton disabled={isPending || (!isDirty && !entryChanged)}>
            {submitLabel}
          </FormSubmitButton>
        </div>
      ) : null}
    </form>
  );
}
