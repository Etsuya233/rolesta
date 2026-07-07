import { countPromptTokens } from "@rolesta/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  createWorldbookEntry,
  deleteWorldbookEntry,
  getWorldbook,
  updateWorldbookEntry,
  type WorldbookInsertionPosition,
} from "../api/worldbooks-api";
import {
  emptyWorldbookEntryEditorForm,
  worldbookEntryEditorFormFromEntry,
  worldbookEntryValuesFromForm,
  type WorldbookEntryEditorFormState,
} from "../model/worldbook-editor-form";
import {
  FormError,
  FormSubmitButton,
  WorldbookCheckboxField,
  WorldbookNumberField,
  WorldbookSelectField,
  WorldbookTextAreaField,
  WorldbookTextField,
} from "./worldbook-form-fields";

export function WorldbookEntryEditor({
  worldbookId,
  entryId,
  submitLabel,
  onSaved,
}: {
  worldbookId: string;
  entryId?: string;
  submitLabel: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WorldbookEntryEditorFormState>(
    emptyWorldbookEntryEditorForm,
  );
  const [visibleError, setVisibleError] = useState<string | null>(null);
  const worldbookQuery = useQuery({
    enabled: Boolean(entryId),
    queryKey: ["worldbook", worldbookId],
    queryFn: () => getWorldbook(worldbookId),
  });
  const entry = worldbookQuery.data?.entries.find(
    (candidate) => candidate.id === entryId,
  );
  const positionOptions: Array<{
    value: WorldbookInsertionPosition;
    label: string;
  }> = [
    {
      value: "beforeChar",
      label: t("worldbooks.entries.positions.beforeChar"),
    },
    { value: "afterChar", label: t("worldbooks.entries.positions.afterChar") },
    {
      value: "beforeHistory",
      label: t("worldbooks.entries.positions.beforeHistory"),
    },
    {
      value: "afterHistory",
      label: t("worldbooks.entries.positions.afterHistory"),
    },
    { value: "unknown", label: t("worldbooks.entries.positions.unknown") },
  ];

  useEffect(() => {
    if (entry) {
      setForm(worldbookEntryEditorFormFromEntry(entry));
    }
  }, [entry]);

  const saveMutation = useMutation({
    mutationFn: () =>
      entryId
        ? updateWorldbookEntry(
            worldbookId,
            entryId,
            worldbookEntryValuesFromForm(form, "update"),
          )
        : createWorldbookEntry(
            worldbookId,
            worldbookEntryValuesFromForm(form, "create"),
          ),
    async onSuccess(worldbook) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(["worldbook", worldbook.id], worldbook);
      onSaved();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteWorldbookEntry(worldbookId, entryId!),
    async onSuccess(worldbook) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(["worldbook", worldbook.id], worldbook);
      onSaved();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVisibleError(null);

    if (!form.name.trim()) {
      setVisibleError(t("worldbooks.entries.errors.nameRequired"));
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
          <WorldbookTextField
            disabled={saveMutation.isPending}
            id={`${fieldPrefix}-name`}
            label={t("worldbooks.entries.fields.name")}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <WorldbookCheckboxField
              checked={form.enabled}
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-enabled`}
              label={t("worldbooks.entries.fields.enabled")}
              onChange={(enabled) => setForm({ ...form, enabled })}
            />
            <WorldbookCheckboxField
              checked={form.constant}
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-constant`}
              label={t("worldbooks.entries.fields.constant")}
              onChange={(constant) => setForm({ ...form, constant })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <WorldbookCheckboxField
              checked={form.selective}
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-selective`}
              label={t("worldbooks.entries.fields.selective")}
              onChange={(selective) => setForm({ ...form, selective })}
            />
            <WorldbookCheckboxField
              checked={form.caseSensitive}
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-case-sensitive`}
              label={t("worldbooks.entries.fields.caseSensitive")}
              onChange={(caseSensitive) => setForm({ ...form, caseSensitive })}
            />
          </div>
          <WorldbookCheckboxField
            checked={form.matchWholeWords}
            disabled={saveMutation.isPending}
            id={`${fieldPrefix}-whole-words`}
            label={t("worldbooks.entries.fields.matchWholeWords")}
            onChange={(matchWholeWords) =>
              setForm({ ...form, matchWholeWords })
            }
          />
          <WorldbookTextAreaField
            disabled={saveMutation.isPending}
            id={`${fieldPrefix}-primary-keys`}
            label={t("worldbooks.entries.fields.primaryKeys")}
            rows={3}
            value={form.primaryKeysText}
            onChange={(event) =>
              setForm({ ...form, primaryKeysText: event.target.value })
            }
          />
          <WorldbookTextAreaField
            disabled={saveMutation.isPending}
            id={`${fieldPrefix}-secondary-keys`}
            label={t("worldbooks.entries.fields.secondaryKeys")}
            rows={3}
            value={form.secondaryKeysText}
            onChange={(event) =>
              setForm({ ...form, secondaryKeysText: event.target.value })
            }
          />
          <WorldbookTextAreaField
            disabled={saveMutation.isPending}
            id={`${fieldPrefix}-content`}
            label={t("worldbooks.entries.fields.content")}
            rows={14}
            value={form.content}
            onChange={(event) =>
              setForm({ ...form, content: event.target.value })
            }
          />
          <div className="rounded-md border border-border px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              {t("worldbooks.metrics.tokenCount")}{" "}
            </span>
            <span className="font-semibold tabular-nums">
              {countPromptTokens(form.content).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <WorldbookSelectField
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-position`}
              label={t("worldbooks.entries.fields.insertionPosition")}
              options={positionOptions}
              value={form.insertionPosition}
              onChange={(insertionPosition) =>
                setForm({ ...form, insertionPosition })
              }
            />
            <WorldbookNumberField
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-order`}
              label={t("worldbooks.entries.fields.insertionOrder")}
              value={form.insertionOrder}
              onChange={(insertionOrder) =>
                setForm({ ...form, insertionOrder: insertionOrder ?? 0 })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <WorldbookNumberField
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-depth`}
              label={t("worldbooks.entries.fields.depth")}
              value={form.depth}
              onChange={(depth) => setForm({ ...form, depth: depth ?? 0 })}
            />
            <WorldbookNumberField
              disabled={saveMutation.isPending}
              id={`${fieldPrefix}-probability`}
              label={t("worldbooks.entries.fields.probability")}
              value={form.probability}
              onChange={(probability) =>
                setForm({ ...form, probability: probability ?? 0 })
              }
            />
          </div>
          <WorldbookTextAreaField
            disabled={saveMutation.isPending}
            id={`${fieldPrefix}-comment`}
            label={t("worldbooks.entries.fields.comment")}
            rows={4}
            value={form.comment}
            onChange={(event) =>
              setForm({ ...form, comment: event.target.value })
            }
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        {visibleError || saveMutation.isError ? (
          <FormError>
            {visibleError ?? t("worldbooks.entries.errors.saveFailed")}
          </FormError>
        ) : null}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <FormSubmitButton disabled={saveMutation.isPending}>
            {submitLabel}
          </FormSubmitButton>
          {entryId ? (
            <Button
              aria-label={t("worldbooks.entries.deleteAction")}
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
