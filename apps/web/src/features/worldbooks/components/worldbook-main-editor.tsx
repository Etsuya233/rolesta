import type { TFunction } from "i18next";
import { BadgeInfo, BookOpenText, SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion } from "../../../components/ui/accordion";
import { useWorldbookDraftSession } from "../hooks/use-worldbook-draft-sessions";
import type {
  WorldbookDetailResponse,
  WorldbookVisibility,
} from "../api/worldbooks-api";
import {
  FormActionButton,
  FormError,
  FormSubmitButton,
  WorldbookCheckboxField,
  WorldbookFormSection,
  WorldbookNumberField,
  WorldbookSelectField,
  WorldbookTextAreaField,
  WorldbookTextField,
} from "./worldbook-form-fields";

export function WorldbookMainEditor({
  sessionKey,
  worldbookId,
  submitLabel,
  onCreated,
  onOpenEntries,
}: {
  sessionKey: string;
  worldbookId?: string;
  submitLabel: string;
  onCreated?: (worldbook: WorldbookDetailResponse) => void;
  onOpenEntries?: () => void;
}) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const [openSections, setOpenSections] = useState<string[]>([
    "basic",
    "matching",
  ]);
  const { form, setForm, isPending, visibleError, worldbook, submit } =
    useWorldbookDraftSession({
      sessionKey,
      ...(worldbookId ? { worldbookId } : {}),
      ...(onCreated ? { onCreated } : {}),
    });
  const visibilityOptions: Array<{
    value: WorldbookVisibility;
    label: string;
  }> = [
    { value: "private", label: t("worldbooks.list.privateVisibility") },
    { value: "public", label: t("worldbooks.list.publicVisibility") },
  ];

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
            summary={basicSummary({ form, worldbook, t })}
            title={t("worldbooks.editor.sections.basic.title")}
            value="basic"
          >
            <WorldbookTextField
              disabled={isPending}
              id={`${fieldPrefix}-name`}
              label={t("worldbooks.editor.fields.name")}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <WorldbookTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-description`}
              label={t("worldbooks.editor.fields.description")}
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
            <WorldbookTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-tags`}
              label={t("worldbooks.editor.fields.tags")}
              rows={3}
              value={form.tagsText}
              onChange={(event) =>
                setForm({ ...form, tagsText: event.target.value })
              }
            />
            <WorldbookSelectField
              disabled={isPending}
              id={`${fieldPrefix}-visibility`}
              label={t("worldbooks.editor.fields.visibility")}
              options={visibilityOptions}
              value={form.visibility}
              onChange={(visibility) => setForm({ ...form, visibility })}
            />
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Metric
                label={t("worldbooks.metrics.entryCount")}
                value={String(worldbook?.entryCount ?? 0)}
              />
              <Metric
                label={t("worldbooks.metrics.enabledEntryCount")}
                value={String(worldbook?.enabledEntryCount ?? 0)}
              />
              <Metric
                label={t("worldbooks.metrics.tokenCount")}
                value={String(worldbook?.tokenCount ?? 0)}
              />
            </div>
            {onOpenEntries ? (
              <FormActionButton disabled={isPending} onClick={onOpenEntries}>
                {t("worldbooks.entries.title")}
              </FormActionButton>
            ) : null}
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={SlidersHorizontal}
            summary={matchingSummary({ form, t })}
            title={t("worldbooks.editor.sections.matching.title")}
            value="matching"
          >
            <div className="grid grid-cols-2 gap-3">
              <WorldbookNumberField
                disabled={isPending}
                id={`${fieldPrefix}-scan-depth`}
                label={t("worldbooks.editor.fields.scanDepth")}
                value={form.scanDepth}
                onChange={(scanDepth) =>
                  setForm({ ...form, scanDepth: scanDepth ?? 0 })
                }
              />
              <WorldbookNumberField
                disabled={isPending}
                id={`${fieldPrefix}-token-budget`}
                label={t("worldbooks.editor.fields.tokenBudget")}
                value={form.tokenBudget}
                onChange={(tokenBudget) =>
                  setForm({ ...form, tokenBudget: tokenBudget ?? 0 })
                }
              />
            </div>
            <WorldbookCheckboxField
              checked={form.recursiveScan}
              disabled={isPending}
              id={`${fieldPrefix}-recursive`}
              label={t("worldbooks.editor.fields.recursiveScan")}
              onChange={(recursiveScan) => setForm({ ...form, recursiveScan })}
            />
          </WorldbookFormSection>

          <WorldbookFormSection
            icon={BookOpenText}
            summary={t("worldbooks.editor.sections.source.summary")}
            title={t("worldbooks.editor.sections.source.title")}
            value="source"
          >
            <div className="rounded-md border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {t("worldbooks.editor.fields.sourceFormat")}{" "}
              </span>
              <span className="font-medium">
                {worldbook?.sourceFormat ?? "rolesta"}
              </span>
            </div>
          </WorldbookFormSection>
        </Accordion>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        {visibleError ? <FormError>{visibleError}</FormError> : null}
        <FormSubmitButton disabled={isPending}>{submitLabel}</FormSubmitButton>
      </div>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border px-3 py-2">
      <div className="truncate text-xs text-muted-foreground">{label}</div>
      <div className="truncate text-base font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function basicSummary({
  form,
  worldbook,
  t,
}: {
  form: { name: string; tagsText: string; visibility: WorldbookVisibility };
  worldbook: WorldbookDetailResponse | undefined;
  t: TFunction;
}): string {
  const title = form.name.trim() || t("worldbooks.editor.summaries.unnamed");

  return `${title} · ${t(`worldbooks.list.${form.visibility}Visibility`)} · ${t(
    "worldbooks.editor.summaries.entries",
    { value: worldbook?.entryCount ?? 0 },
  )}`;
}

function matchingSummary({
  form,
  t,
}: {
  form: { scanDepth: number; tokenBudget: number; recursiveScan: boolean };
  t: TFunction;
}): string {
  return `${t("worldbooks.editor.summaries.scanDepth", {
    value: form.scanDepth,
  })} · ${t("worldbooks.editor.summaries.tokenBudget", {
    value: form.tokenBudget,
  })} · ${
    form.recursiveScan
      ? t("worldbooks.editor.summaries.recursiveEnabled")
      : t("worldbooks.editor.summaries.recursiveDisabled")
  }`;
}
