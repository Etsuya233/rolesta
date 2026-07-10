import { countPromptTokens } from "@rolesta/shared";
import { Trash2 } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { notify } from "../../../lib/notifications/notify";
import {
  type WorldbookEntryRole,
  type WorldbookInsertionPosition,
  type WorldbookSelectiveLogic,
} from "../api/worldbooks-api";
import { useWorldbookDraftSession } from "../hooks/use-worldbook-draft-sessions";
import {
  emptyWorldbookEntryEditorForm,
  worldbookEntryEditorFormFromEntry,
  worldbookEntryValuesFromForm,
  type WorldbookEntryEditorFormState,
} from "../model/worldbook-editor-form";
import {
  FormSubmitButton,
  WorldbookCheckboxField,
  WorldbookNumberField,
  WorldbookSelectField,
  WorldbookTextAreaField,
  WorldbookTextField,
} from "./worldbook-form-fields";

export function WorldbookEntryEditor({
  worldbookId,
  sessionKey,
  entryId,
  submitLabel,
  onSaved,
  onDeleted,
}: {
  worldbookId: string;
  sessionKey: string;
  entryId?: string;
  submitLabel: string;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const [form, setForm] = useState<WorldbookEntryEditorFormState>(
    emptyWorldbookEntryEditorForm,
  );
  const { document, setDocument, isDirty, isPending, saveDocument } =
    useWorldbookDraftSession({
      worldbookId,
      sessionKey,
    });
  const entry = document.entries.find((candidate) => candidate.id === entryId);
  const positionOptions: Array<{
    value: WorldbookInsertionPosition;
    label: string;
  }> = [
    {
      value: "beforeCharacterDefinition",
      label: t("worldbooks.entries.positions.beforeCharacterDefinition"),
    },
    {
      value: "afterCharacterDefinition",
      label: t("worldbooks.entries.positions.afterCharacterDefinition"),
    },
    {
      value: "beforeExampleMessages",
      label: t("worldbooks.entries.positions.beforeExampleMessages"),
    },
    {
      value: "afterExampleMessages",
      label: t("worldbooks.entries.positions.afterExampleMessages"),
    },
    {
      value: "beforeAuthorsNote",
      label: t("worldbooks.entries.positions.beforeAuthorsNote"),
    },
    {
      value: "afterAuthorsNote",
      label: t("worldbooks.entries.positions.afterAuthorsNote"),
    },
    { value: "atDepth", label: t("worldbooks.entries.positions.atDepth") },
    { value: "atAnchor", label: t("worldbooks.entries.positions.atAnchor") },
    { value: "unknown", label: t("worldbooks.entries.positions.unknown") },
  ];
  const roleOptions: Array<{ value: WorldbookEntryRole; label: string }> = [
    { value: "system", label: t("worldbooks.entries.roles.system") },
    { value: "user", label: t("worldbooks.entries.roles.user") },
    { value: "assistant", label: t("worldbooks.entries.roles.assistant") },
  ];
  const selectiveLogicOptions: Array<{
    value: WorldbookSelectiveLogic;
    label: string;
  }> = [
    { value: "andAny", label: t("worldbooks.entries.selectiveLogic.andAny") },
    { value: "andAll", label: t("worldbooks.entries.selectiveLogic.andAll") },
    { value: "notAll", label: t("worldbooks.entries.selectiveLogic.notAll") },
    { value: "notAny", label: t("worldbooks.entries.selectiveLogic.notAny") },
  ];

  useEffect(() => {
    if (entry) {
      setForm(
        worldbookEntryEditorFormFromEntry(
          entry,
          document.entries.findIndex((candidate) => candidate.id === entry.id),
        ),
      );
    }
  }, [document.entries, entry]);

  function updateForm(nextForm: WorldbookEntryEditorFormState) {
    setForm(nextForm);

    if (!entryId || !entry) {
      return;
    }

    const nextEntry = {
      id: entryId,
      ...worldbookEntryValuesFromForm(nextForm),
    };
    setDocument((current) => {
      const entries = current.entries.filter(
        (candidate) => candidate.id !== entryId,
      );
      const insertionOrder = Math.max(
        0,
        Math.min(nextForm.insertionOrder, entries.length),
      );
      entries.splice(insertionOrder, 0, nextEntry);

      return { ...current, entries };
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      notify.error({ title: t("worldbooks.entries.errors.nameRequired") });
      return;
    }

    const values = worldbookEntryValuesFromForm(form);
    const id = entryId ?? crypto.randomUUID();
    let entries = entryId
      ? document.entries.filter((candidate) => candidate.id !== entryId)
      : [...document.entries];
    const nextEntry = { id, ...values };

    if (entryId) {
      const insertionOrder = Math.max(
        0,
        Math.min(form.insertionOrder, entries.length),
      );
      entries = [
        ...entries.slice(0, insertionOrder),
        nextEntry,
        ...entries.slice(insertionOrder),
      ];
    } else {
      entries.push(nextEntry);
    }

    saveDocument({ ...document, entries }, onSaved);
  }

  function deleteEntry() {
    saveDocument(
      {
        ...document,
        entries: document.entries.filter(
          (candidate) => candidate.id !== entryId,
        ),
      },
      onDeleted,
    );
  }

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={submit}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-5">
          <WorldbookEntrySection title={t("worldbooks.entries.sections.basic")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookTextField
                disabled={isPending}
                id={`${fieldPrefix}-name`}
                label={t("worldbooks.entries.fields.name")}
                value={form.name}
                onChange={(event) =>
                  updateForm({ ...form, name: event.target.value })
                }
              />
              <WorldbookNumberField
                disabled={isPending}
                id={`${fieldPrefix}-probability`}
                label={t("worldbooks.entries.fields.probability")}
                value={form.probability}
                onChange={(probability) =>
                  updateForm({ ...form, probability: probability ?? 0 })
                }
              />
            </div>
            <WorldbookTextAreaField
              className="min-h-24"
              disabled={isPending}
              id={`${fieldPrefix}-comment`}
              label={t("worldbooks.entries.fields.comment")}
              rows={3}
              value={form.comment}
              onChange={(event) =>
                updateForm({ ...form, comment: event.target.value })
              }
            />
          </WorldbookEntrySection>

          <WorldbookEntrySection
            title={t("worldbooks.entries.sections.content")}
          >
            <WorldbookTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-content`}
              label={t("worldbooks.entries.fields.content")}
              rows={10}
              value={form.content}
              onChange={(event) =>
                updateForm({ ...form, content: event.target.value })
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
          </WorldbookEntrySection>

          <WorldbookEntrySection
            title={t("worldbooks.entries.sections.matching")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookTextAreaField
                className="min-h-20"
                disabled={isPending}
                id={`${fieldPrefix}-primary-keys`}
                label={t("worldbooks.entries.fields.primaryKeys")}
                rows={2}
                value={form.primaryKeysText}
                onChange={(event) =>
                  updateForm({ ...form, primaryKeysText: event.target.value })
                }
              />
              <WorldbookTextAreaField
                className="min-h-20"
                disabled={isPending}
                id={`${fieldPrefix}-secondary-keys`}
                label={t("worldbooks.entries.fields.secondaryKeys")}
                rows={2}
                value={form.secondaryKeysText}
                onChange={(event) =>
                  updateForm({ ...form, secondaryKeysText: event.target.value })
                }
              />
            </div>
            <WorldbookSelectField
              disabled={isPending}
              id={`${fieldPrefix}-selective-logic`}
              label={t("worldbooks.entries.fields.selectiveLogic")}
              options={selectiveLogicOptions}
              value={form.selectiveLogic}
              onChange={(selectiveLogic) =>
                updateForm({ ...form, selectiveLogic })
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookCheckboxField
                checked={form.constant}
                disabled={isPending}
                id={`${fieldPrefix}-constant`}
                label={t("worldbooks.entries.fields.constant")}
                onChange={(constant) => updateForm({ ...form, constant })}
              />
              <WorldbookCheckboxField
                checked={form.vectorized}
                disabled={isPending}
                id={`${fieldPrefix}-vectorized`}
                label={t("worldbooks.entries.fields.vectorized")}
                onChange={(vectorized) => updateForm({ ...form, vectorized })}
              />
              <WorldbookCheckboxField
                checked={form.selective}
                disabled={isPending}
                id={`${fieldPrefix}-selective`}
                label={t("worldbooks.entries.fields.selective")}
                onChange={(selective) => updateForm({ ...form, selective })}
              />
              <WorldbookCheckboxField
                checked={form.caseSensitive}
                disabled={isPending}
                id={`${fieldPrefix}-case-sensitive`}
                label={t("worldbooks.entries.fields.caseSensitive")}
                onChange={(caseSensitive) =>
                  updateForm({ ...form, caseSensitive })
                }
              />
              <WorldbookCheckboxField
                checked={form.matchWholeWords}
                disabled={isPending}
                id={`${fieldPrefix}-whole-words`}
                label={t("worldbooks.entries.fields.matchWholeWords")}
                onChange={(matchWholeWords) =>
                  updateForm({ ...form, matchWholeWords })
                }
              />
            </div>
          </WorldbookEntrySection>

          <WorldbookEntrySection
            title={t("worldbooks.entries.sections.insertion")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookSelectField
                disabled={isPending}
                id={`${fieldPrefix}-position`}
                label={t("worldbooks.entries.fields.insertionPosition")}
                options={positionOptions}
                value={form.insertionPosition}
                onChange={(insertionPosition) =>
                  updateForm({ ...form, insertionPosition })
                }
              />
              <WorldbookNumberField
                disabled={isPending}
                id={`${fieldPrefix}-order`}
                label={t("worldbooks.entries.fields.insertionOrder")}
                value={form.insertionOrder}
                onChange={(insertionOrder) =>
                  updateForm({
                    ...form,
                    insertionOrder: insertionOrder ?? 0,
                  })
                }
              />
            </div>
            {form.insertionPosition === "atDepth" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <WorldbookNumberField
                  disabled={isPending}
                  id={`${fieldPrefix}-depth`}
                  label={t("worldbooks.entries.fields.depth")}
                  value={form.depth}
                  onChange={(depth) =>
                    updateForm({ ...form, depth: depth ?? 0 })
                  }
                />
                <WorldbookSelectField
                  disabled={isPending}
                  id={`${fieldPrefix}-role`}
                  label={t("worldbooks.entries.fields.insertionRole")}
                  options={roleOptions}
                  value={form.insertionRole}
                  onChange={(insertionRole) =>
                    updateForm({ ...form, insertionRole })
                  }
                />
              </div>
            ) : null}
            {form.insertionPosition === "atAnchor" ? (
              <WorldbookTextField
                disabled={isPending}
                id={`${fieldPrefix}-anchor-name`}
                label={t("worldbooks.entries.fields.anchorName")}
                value={form.anchorName}
                onChange={(event) =>
                  updateForm({ ...form, anchorName: event.target.value })
                }
              />
            ) : null}
          </WorldbookEntrySection>

          <WorldbookEntrySection
            title={t("worldbooks.entries.sections.scanAndRecursion")}
          >
            <WorldbookNumberField
              disabled={isPending}
              id={`${fieldPrefix}-entry-scan-depth`}
              label={t("worldbooks.entries.fields.entryScanDepth")}
              value={form.scanDepth}
              onChange={(scanDepth) => updateForm({ ...form, scanDepth })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookCheckboxField
                checked={form.excludeRecursion}
                disabled={isPending}
                id={`${fieldPrefix}-exclude-recursion`}
                label={t("worldbooks.entries.fields.excludeRecursion")}
                onChange={(excludeRecursion) =>
                  updateForm({ ...form, excludeRecursion })
                }
              />
              <WorldbookCheckboxField
                checked={form.preventRecursion}
                disabled={isPending}
                id={`${fieldPrefix}-prevent-recursion`}
                label={t("worldbooks.entries.fields.preventRecursion")}
                onChange={(preventRecursion) =>
                  updateForm({ ...form, preventRecursion })
                }
              />
              <WorldbookCheckboxField
                checked={form.delayUntilRecursion}
                disabled={isPending}
                id={`${fieldPrefix}-delay-until-recursion`}
                label={t("worldbooks.entries.fields.delayUntilRecursion")}
                onChange={(delayUntilRecursion) =>
                  updateForm({ ...form, delayUntilRecursion })
                }
              />
            </div>
          </WorldbookEntrySection>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <FormSubmitButton
            disabled={isPending || Boolean(entryId && !isDirty)}
          >
            {submitLabel}
          </FormSubmitButton>
          {entryId ? (
            <Button
              aria-label={t("worldbooks.entries.deleteAction")}
              disabled={isPending}
              size="icon-lg"
              type="button"
              variant="outline"
              onClick={deleteEntry}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function WorldbookEntrySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
