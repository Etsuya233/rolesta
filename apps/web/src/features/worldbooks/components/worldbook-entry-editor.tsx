import { countPromptTokens } from "@rolesta/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeInfo,
  Filter,
  GitBranch,
  Layers3,
  MapPinned,
  SlidersHorizontal,
  StickyNote,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Accordion } from "../../../components/ui/accordion";
import { Button } from "../../../components/ui/button";
import {
  createWorldbookEntry,
  deleteWorldbookEntry,
  getWorldbook,
  updateWorldbookEntry,
  type WorldbookConditionLogic,
  type WorldbookDepthRole,
  type WorldbookInsertionPosition,
  type WorldbookTriState,
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
  WorldbookFormSection,
  WorldbookNumberField,
  WorldbookSelectField,
  WorldbookTextAreaField,
  WorldbookTextField,
} from "./worldbook-form-fields";

type BooleanSelectValue = "true" | "false";

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
  const [openSections, setOpenSections] = useState<string[]>([
    "content",
    "matching",
    "insertion",
  ]);
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

  const booleanOptions: Array<{ value: BooleanSelectValue; label: string }> = [
    { value: "true", label: t("worldbooks.entries.boolean.enabled") },
    { value: "false", label: t("worldbooks.entries.boolean.disabled") },
  ];
  const triStateOptions: Array<{ value: WorldbookTriState; label: string }> = [
    { value: "inherit", label: t("worldbooks.entries.triState.inherit") },
    { value: "enabled", label: t("worldbooks.entries.triState.enabled") },
    { value: "disabled", label: t("worldbooks.entries.triState.disabled") },
  ];
  const conditionLogicOptions: Array<{
    value: WorldbookConditionLogic;
    label: string;
  }> = [
    { value: "andAny", label: t("worldbooks.entries.logic.andAny") },
    { value: "notAll", label: t("worldbooks.entries.logic.notAll") },
    { value: "notAny", label: t("worldbooks.entries.logic.notAny") },
    { value: "andAll", label: t("worldbooks.entries.logic.andAll") },
  ];
  const depthRoleOptions: Array<{ value: WorldbookDepthRole; label: string }> =
    [
      { value: "system", label: t("worldbooks.entries.depthRoles.system") },
      { value: "user", label: t("worldbooks.entries.depthRoles.user") },
      {
        value: "assistant",
        label: t("worldbooks.entries.depthRoles.assistant"),
      },
    ];
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
      value: "beforeAuthorNote",
      label: t("worldbooks.entries.positions.beforeAuthorNote"),
    },
    {
      value: "afterAuthorNote",
      label: t("worldbooks.entries.positions.afterAuthorNote"),
    },
    { value: "atDepth", label: t("worldbooks.entries.positions.atDepth") },
    {
      value: "beforeExampleMessages",
      label: t("worldbooks.entries.positions.beforeExampleMessages"),
    },
    {
      value: "afterExampleMessages",
      label: t("worldbooks.entries.positions.afterExampleMessages"),
    },
    { value: "outlet", label: t("worldbooks.entries.positions.outlet") },
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
  const disabled = saveMutation.isPending;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVisibleError(null);

    if (!form.name.trim()) {
      setVisibleError(t("worldbooks.entries.errors.nameRequired"));
      return;
    }

    saveMutation.mutate();
  }

  function setBoolean(
    field: keyof BooleanEntryFields,
    value: BooleanSelectValue,
  ) {
    setForm({ ...form, [field]: value === "true" });
  }

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={submit}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Accordion
          className="border-b border-border"
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
        >
          <WorldbookFormSection
            icon={BadgeInfo}
            summary={entrySummary(form, t)}
            title={t("worldbooks.entries.sections.content.title")}
            value="content"
          >
            <WorldbookTextField
              disabled={disabled}
              id={`${fieldPrefix}-name`}
              label={t("worldbooks.entries.fields.name")}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-enabled`}
                label={t("worldbooks.entries.fields.enabled")}
                options={booleanOptions}
                value={booleanSelectValue(form.enabled)}
                onChange={(value) => setBoolean("enabled", value)}
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-constant`}
                label={t("worldbooks.entries.fields.constant")}
                options={booleanOptions}
                value={booleanSelectValue(form.constant)}
                onChange={(value) => setBoolean("constant", value)}
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-add-memo`}
                label={t("worldbooks.entries.fields.addMemo")}
                options={booleanOptions}
                value={booleanSelectValue(form.addMemo)}
                onChange={(value) => setBoolean("addMemo", value)}
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-vectorized`}
                label={t("worldbooks.entries.fields.vectorized")}
                options={booleanOptions}
                value={booleanSelectValue(form.vectorized)}
                onChange={(value) => setBoolean("vectorized", value)}
              />
            </div>
            <WorldbookTextAreaField
              disabled={disabled}
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
            <WorldbookNumberField
              disabled={disabled}
              id={`${fieldPrefix}-external-uid`}
              label={t("worldbooks.entries.fields.externalUid")}
              value={form.externalUid}
              onChange={(externalUid) => setForm({ ...form, externalUid })}
            />
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={SlidersHorizontal}
            summary={t("worldbooks.entries.sections.matching.summary")}
            title={t("worldbooks.entries.sections.matching.title")}
            value="matching"
          >
            <WorldbookTextAreaField
              compact
              disabled={disabled}
              id={`${fieldPrefix}-primary-keys`}
              label={t("worldbooks.entries.fields.primaryKeys")}
              rows={2}
              value={form.primaryKeysText}
              onChange={(event) =>
                setForm({ ...form, primaryKeysText: event.target.value })
              }
            />
            <WorldbookTextAreaField
              compact
              disabled={disabled}
              id={`${fieldPrefix}-secondary-keys`}
              label={t("worldbooks.entries.fields.secondaryKeys")}
              rows={2}
              value={form.secondaryKeysText}
              onChange={(event) =>
                setForm({ ...form, secondaryKeysText: event.target.value })
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-condition-logic`}
                label={t("worldbooks.entries.fields.conditionLogic")}
                options={conditionLogicOptions}
                value={form.conditionLogic}
                onChange={(conditionLogic) =>
                  setForm({ ...form, conditionLogic })
                }
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-selective`}
                label={t("worldbooks.entries.fields.selective")}
                options={booleanOptions}
                value={booleanSelectValue(form.selective)}
                onChange={(value) => setBoolean("selective", value)}
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-case-sensitive`}
                label={t("worldbooks.entries.fields.caseSensitive")}
                options={triStateOptions}
                value={form.caseSensitive}
                onChange={(caseSensitive) =>
                  setForm({ ...form, caseSensitive })
                }
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-whole-words`}
                label={t("worldbooks.entries.fields.matchWholeWords")}
                options={triStateOptions}
                value={form.matchWholeWords}
                onChange={(matchWholeWords) =>
                  setForm({ ...form, matchWholeWords })
                }
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-scan-depth`}
                label={t("worldbooks.entries.fields.scanDepth")}
                value={form.scanDepth}
                onChange={(scanDepth) => setForm({ ...form, scanDepth })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {matchingSourceFields.map((field) => (
                <WorldbookSelectField
                  key={field}
                  disabled={disabled}
                  id={`${fieldPrefix}-${field}`}
                  label={t(`worldbooks.entries.fields.${field}`)}
                  options={booleanOptions}
                  value={booleanSelectValue(form[field])}
                  onChange={(value) => setBoolean(field, value)}
                />
              ))}
            </div>
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={MapPinned}
            summary={t("worldbooks.entries.sections.insertion.summary")}
            title={t("worldbooks.entries.sections.insertion.title")}
            value="insertion"
          >
            <WorldbookSelectField
              disabled={disabled}
              id={`${fieldPrefix}-position`}
              label={t("worldbooks.entries.fields.insertionPosition")}
              options={positionOptions}
              value={form.insertionPosition}
              onChange={(insertionPosition) =>
                setForm({ ...form, insertionPosition })
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-depth-role`}
                label={t("worldbooks.entries.fields.depthRole")}
                options={depthRoleOptions}
                value={form.depthRole}
                onChange={(depthRole) => setForm({ ...form, depthRole })}
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-insertion-depth`}
                label={t("worldbooks.entries.fields.insertionDepth")}
                value={form.insertionDepth}
                onChange={(insertionDepth) =>
                  setForm({ ...form, insertionDepth: insertionDepth ?? 0 })
                }
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-order`}
                label={t("worldbooks.entries.fields.insertionOrder")}
                value={form.insertionOrder}
                onChange={(insertionOrder) =>
                  setForm({ ...form, insertionOrder: insertionOrder ?? 0 })
                }
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-display-order`}
                label={t("worldbooks.entries.fields.displayOrder")}
                value={form.displayOrder}
                onChange={(displayOrder) =>
                  setForm({ ...form, displayOrder: displayOrder ?? 0 })
                }
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-use-probability`}
                label={t("worldbooks.entries.fields.useProbability")}
                options={booleanOptions}
                value={booleanSelectValue(form.useProbability)}
                onChange={(value) => setBoolean("useProbability", value)}
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-probability`}
                label={t("worldbooks.entries.fields.probability")}
                value={form.probability}
                onChange={(probability) =>
                  setForm({ ...form, probability: probability ?? 0 })
                }
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-ignore-budget`}
                label={t("worldbooks.entries.fields.ignoreBudget")}
                options={booleanOptions}
                value={booleanSelectValue(form.ignoreBudget)}
                onChange={(value) => setBoolean("ignoreBudget", value)}
              />
              <WorldbookTextField
                disabled={disabled}
                id={`${fieldPrefix}-outlet-name`}
                label={t("worldbooks.entries.fields.outletName")}
                value={form.outletName}
                onChange={(event) =>
                  setForm({ ...form, outletName: event.target.value })
                }
              />
            </div>
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={GitBranch}
            summary={t("worldbooks.entries.sections.recursion.summary")}
            title={t("worldbooks.entries.sections.recursion.title")}
            value="recursion"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-recursive-scan`}
                label={t("worldbooks.entries.fields.recursiveScan")}
                options={booleanOptions}
                value={booleanSelectValue(form.recursiveScan)}
                onChange={(value) => setBoolean("recursiveScan", value)}
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-prevent-recursion`}
                label={t("worldbooks.entries.fields.preventFurtherRecursion")}
                options={booleanOptions}
                value={booleanSelectValue(form.preventFurtherRecursion)}
                onChange={(value) =>
                  setBoolean("preventFurtherRecursion", value)
                }
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-delay-until-recursion`}
                label={t("worldbooks.entries.fields.delayUntilRecursion")}
                options={booleanOptions}
                value={booleanSelectValue(form.delayUntilRecursion)}
                onChange={(value) => setBoolean("delayUntilRecursion", value)}
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-recursion-delay-level`}
                label={t("worldbooks.entries.fields.recursionDelayLevel")}
                value={form.recursionDelayLevel}
                onChange={(recursionDelayLevel) =>
                  setForm({ ...form, recursionDelayLevel })
                }
              />
            </div>
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={Layers3}
            summary={t("worldbooks.entries.sections.grouping.summary")}
            title={t("worldbooks.entries.sections.grouping.title")}
            value="grouping"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookTextField
                disabled={disabled}
                id={`${fieldPrefix}-group`}
                label={t("worldbooks.entries.fields.group")}
                value={form.group}
                onChange={(event) =>
                  setForm({ ...form, group: event.target.value })
                }
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-group-weight`}
                label={t("worldbooks.entries.fields.groupWeight")}
                value={form.groupWeight}
                onChange={(groupWeight) =>
                  setForm({ ...form, groupWeight: groupWeight ?? 1 })
                }
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-group-override`}
                label={t("worldbooks.entries.fields.groupOverride")}
                options={booleanOptions}
                value={booleanSelectValue(form.groupOverride)}
                onChange={(value) => setBoolean("groupOverride", value)}
              />
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-group-scoring`}
                label={t("worldbooks.entries.fields.useGroupScoring")}
                options={triStateOptions}
                value={form.useGroupScoring}
                onChange={(useGroupScoring) =>
                  setForm({ ...form, useGroupScoring })
                }
              />
            </div>
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={Timer}
            summary={t("worldbooks.entries.sections.timing.summary")}
            title={t("worldbooks.entries.sections.timing.title")}
            value="timing"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-sticky`}
                label={t("worldbooks.entries.fields.sticky")}
                value={form.sticky}
                onChange={(sticky) => setForm({ ...form, sticky })}
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-cooldown`}
                label={t("worldbooks.entries.fields.cooldown")}
                value={form.cooldown}
                onChange={(cooldown) => setForm({ ...form, cooldown })}
              />
              <WorldbookNumberField
                disabled={disabled}
                id={`${fieldPrefix}-delay`}
                label={t("worldbooks.entries.fields.delay")}
                value={form.delay}
                onChange={(delay) => setForm({ ...form, delay })}
              />
            </div>
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={Filter}
            summary={t("worldbooks.entries.sections.filtering.summary")}
            title={t("worldbooks.entries.sections.filtering.title")}
            value="filtering"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <WorldbookSelectField
                disabled={disabled}
                id={`${fieldPrefix}-character-filter-exclude`}
                label={t("worldbooks.entries.fields.characterFilterIsExclude")}
                options={booleanOptions}
                value={booleanSelectValue(form.characterFilterIsExclude)}
                onChange={(value) =>
                  setBoolean("characterFilterIsExclude", value)
                }
              />
              <WorldbookTextField
                disabled={disabled}
                id={`${fieldPrefix}-automation-id`}
                label={t("worldbooks.entries.fields.automationId")}
                value={form.automationId}
                onChange={(event) =>
                  setForm({ ...form, automationId: event.target.value })
                }
              />
            </div>
            <WorldbookTextAreaField
              compact
              disabled={disabled}
              id={`${fieldPrefix}-character-filter-names`}
              label={t("worldbooks.entries.fields.characterFilterNames")}
              rows={2}
              value={form.characterFilterNamesText}
              onChange={(event) =>
                setForm({
                  ...form,
                  characterFilterNamesText: event.target.value,
                })
              }
            />
            <WorldbookTextAreaField
              compact
              disabled={disabled}
              id={`${fieldPrefix}-character-filter-tags`}
              label={t("worldbooks.entries.fields.characterFilterTags")}
              rows={2}
              value={form.characterFilterTagsText}
              onChange={(event) =>
                setForm({
                  ...form,
                  characterFilterTagsText: event.target.value,
                })
              }
            />
            <WorldbookTextAreaField
              compact
              disabled={disabled}
              id={`${fieldPrefix}-generation-triggers`}
              label={t("worldbooks.entries.fields.generationTriggers")}
              rows={2}
              value={form.generationTriggersText}
              onChange={(event) =>
                setForm({ ...form, generationTriggersText: event.target.value })
              }
            />
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={StickyNote}
            summary={t("worldbooks.entries.sections.notes.summary")}
            title={t("worldbooks.entries.sections.notes.title")}
            value="notes"
          >
            <WorldbookTextAreaField
              compact
              disabled={disabled}
              id={`${fieldPrefix}-comment`}
              label={t("worldbooks.entries.fields.comment")}
              rows={4}
              value={form.comment}
              onChange={(event) =>
                setForm({ ...form, comment: event.target.value })
              }
            />
          </WorldbookFormSection>
        </Accordion>
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

type BooleanEntryFields = Pick<
  WorldbookEntryEditorFormState,
  | "addMemo"
  | "characterFilterIsExclude"
  | "constant"
  | "delayUntilRecursion"
  | "enabled"
  | "groupOverride"
  | "ignoreBudget"
  | "matchCharacterDepthPrompt"
  | "matchCharacterDescription"
  | "matchCharacterPersonality"
  | "matchCreatorNotes"
  | "matchPersonaDescription"
  | "matchScenario"
  | "preventFurtherRecursion"
  | "recursiveScan"
  | "selective"
  | "useProbability"
  | "vectorized"
>;

const matchingSourceFields: Array<keyof BooleanEntryFields> = [
  "matchPersonaDescription",
  "matchCharacterDescription",
  "matchCharacterPersonality",
  "matchScenario",
  "matchCreatorNotes",
  "matchCharacterDepthPrompt",
];

function booleanSelectValue(value: boolean): BooleanSelectValue {
  return value ? "true" : "false";
}

function entrySummary(
  form: WorldbookEntryEditorFormState,
  t: TFunction,
): string {
  const name = form.name.trim() || t("worldbooks.entries.summaries.unnamed");
  const tokenCount = countPromptTokens(form.content).toLocaleString();

  return `${name} · ${t("worldbooks.entries.summaries.tokens", {
    value: tokenCount,
  })}`;
}
