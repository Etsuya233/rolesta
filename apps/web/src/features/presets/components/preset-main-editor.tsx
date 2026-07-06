import type { TFunction } from "i18next";
import { BadgeInfo, SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion } from "../../../components/ui/accordion";
import { Badge } from "../../../components/ui/badge";
import { usePresetDraftSession } from "../hooks/use-preset-draft-sessions";
import type {
  PresetDetailResponse,
  PresetModelSettings,
} from "../api/presets-api";
import {
  FormActionButton,
  FormError,
  FormSubmitButton,
  PresetCheckboxField,
  PresetFormSection,
  PresetNumberField,
  PresetTextField,
} from "./preset-form-fields";

export interface PresetMainEditorProps {
  sessionKey: string;
  presetId?: string;
  submitLabel: string;
  onCreated?: (preset: PresetDetailResponse) => void;
  onOpenPromptList?: () => void;
}

export function PresetMainEditor({
  sessionKey,
  presetId,
  submitLabel,
  onCreated,
  onOpenPromptList,
}: PresetMainEditorProps) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const [openSections, setOpenSections] = useState<string[]>([
    "basic",
    "model",
  ]);
  const { form, setForm, isPending, visibleError, preset, submit } =
    usePresetDraftSession({
      sessionKey,
      ...(presetId ? { presetId } : {}),
      ...(onCreated ? { onCreated } : {}),
    });
  const settings = form.modelSettings;

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
          <PresetFormSection
            icon={BadgeInfo}
            summary={presetBasicSummary({
              name: form.name,
              tokenCount: preset?.tokenCount ?? 0,
              entryCount: preset?.entryCount ?? 0,
              t,
            })}
            title={t("presets.editor.sections.basic.title")}
            value="basic"
          >
            <PresetTextField
              disabled={isPending}
              id={`${fieldPrefix}-name`}
              label={t("presets.editor.fields.name")}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Model Provider
              </span>
              <Badge variant="outline">{t("presets.editor.unlinkedProvider")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric
                label={t("presets.metrics.totalTokens")}
                value={String(preset?.tokenCount ?? 0)}
              />
              <Metric
                label={t("presets.metrics.entryCount")}
                value={String(preset?.entryCount ?? 0)}
              />
            </div>
            {onOpenPromptList ? (
              <FormActionButton disabled={isPending} onClick={onOpenPromptList}>
                {t("presets.promptList.title")}
              </FormActionButton>
            ) : null}
          </PresetFormSection>

          <PresetFormSection
            icon={SlidersHorizontal}
            summary={presetModelSummary({ settings, t })}
            title={t("presets.editor.sections.model.title")}
            value="model"
          >
            <PresetNumberField
              disabled={isPending}
              id={`${fieldPrefix}-context`}
              label={t("presets.editor.fields.contextLength")}
              value={settings.contextLength}
              onChange={(contextLength) =>
                setForm({
                  ...form,
                  modelSettings: { ...settings, contextLength },
                })
              }
            />
            <PresetNumberField
              disabled={isPending}
              id={`${fieldPrefix}-max-response`}
              label={t("presets.editor.fields.maxResponseLength")}
              value={settings.maxResponseLength}
              onChange={(maxResponseLength) =>
                setForm({
                  ...form,
                  modelSettings: { ...settings, maxResponseLength },
                })
              }
            />
            <PresetCheckboxField
              checked={settings.stream}
              disabled={isPending}
              id={`${fieldPrefix}-stream`}
              label={t("presets.editor.fields.stream")}
              onChange={(stream) =>
                setForm({ ...form, modelSettings: { ...settings, stream } })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              {modelNumberFields.map((field) => (
                <PresetNumberField
                  key={field.key}
                  disabled={isPending}
                  id={`${fieldPrefix}-${field.key}`}
                  label={t(field.labelKey)}
                  value={settings[field.key]}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      modelSettings: { ...settings, [field.key]: value },
                    })
                  }
                />
              ))}
            </div>
            <PresetTextField
              disabled={isPending}
              id={`${fieldPrefix}-reasoning`}
              label={t("presets.editor.fields.reasoningEffort")}
              value={settings.reasoningEffort}
              onChange={(event) =>
                setForm({
                  ...form,
                  modelSettings: {
                    ...settings,
                    reasoningEffort: event.target.value,
                  },
                })
              }
            />
            <PresetTextField
              disabled={isPending}
              id={`${fieldPrefix}-verbosity`}
              label={t("presets.editor.fields.verbosity")}
              value={settings.verbosity}
              onChange={(event) =>
                setForm({
                  ...form,
                  modelSettings: { ...settings, verbosity: event.target.value },
                })
              }
            />
            <PresetCheckboxField
              checked={settings.showThoughts}
              disabled={isPending}
              id={`${fieldPrefix}-thoughts`}
              label={t("presets.editor.fields.showThoughts")}
              onChange={(showThoughts) =>
                setForm({
                  ...form,
                  modelSettings: { ...settings, showThoughts },
                })
              }
            />
          </PresetFormSection>
        </Accordion>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        {visibleError ? <FormError>{visibleError}</FormError> : null}
        <FormSubmitButton disabled={isPending}>{submitLabel}</FormSubmitButton>
      </div>
    </form>
  );
}

function presetBasicSummary({
  name,
  tokenCount,
  entryCount,
  t,
}: {
  name: string;
  tokenCount: number;
  entryCount: number;
  t: TFunction;
}): string {
  const title = name.trim() || t("presets.editor.summaries.unnamed");

  return `${title} · ${t("presets.editor.summaries.tokens", {
    value: tokenCount,
  })} · ${t("presets.editor.summaries.entries", { value: entryCount })}`;
}

function presetModelSummary({
  settings,
  t,
}: {
  settings: PresetModelSettings;
  t: TFunction;
}): string {
  const contextLength =
    settings.contextLength === null
      ? t("presets.editor.summaries.noContext")
      : t("presets.editor.summaries.contextLength", {
          value: settings.contextLength,
        });
  const maxResponseLength =
    settings.maxResponseLength === null
      ? t("presets.editor.summaries.noMaxResponse")
      : t("presets.editor.summaries.maxResponseLength", {
          value: settings.maxResponseLength,
        });
  const stream = settings.stream
    ? t("presets.editor.summaries.streamEnabled")
    : t("presets.editor.summaries.streamDisabled");

  return `${contextLength} · ${maxResponseLength} · ${stream}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="truncate text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

const modelNumberFields = [
  { key: "temperature", labelKey: "presets.editor.fields.temperature" },
  { key: "presencePenalty", labelKey: "presets.editor.fields.presencePenalty" },
  { key: "frequencyPenalty", labelKey: "presets.editor.fields.frequencyPenalty" },
  { key: "repetitionPenalty", labelKey: "presets.editor.fields.repetitionPenalty" },
  { key: "topP", labelKey: "presets.editor.fields.topP" },
  { key: "topK", labelKey: "presets.editor.fields.topK" },
  { key: "minP", labelKey: "presets.editor.fields.minP" },
  { key: "topA", labelKey: "presets.editor.fields.topA" },
  { key: "seed", labelKey: "presets.editor.fields.seed" },
  { key: "n", labelKey: "presets.editor.fields.n" },
] as const;
