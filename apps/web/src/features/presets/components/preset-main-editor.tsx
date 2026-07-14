import type { TFunction } from "i18next";
import { countPromptTokens } from "@rolesta/shared";
import { useQuery } from "@tanstack/react-query";
import { BadgeInfo, SlidersHorizontal, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion } from "../../../components/ui/accordion";
import { Button } from "../../../components/ui/button";
import { Field, FieldError, FieldLabel } from "../../../components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { listAllModelProviders } from "../../model-providers/api/model-providers-api";
import { usePresetDraftSession } from "../hooks/use-preset-draft-sessions";
import type {
  PresetDetailResponse,
  PresetModelSettings,
} from "../api/presets-api";
import {
  FormActionButton,
  FormSubmitButton,
  PresetCheckboxField,
  PresetFormSection,
  PresetNumberField,
  PresetSelectField,
  PresetTextField,
} from "./preset-form-fields";

export interface PresetMainEditorProps {
  sessionKey: string;
  presetId?: string;
  submitLabel?: string;
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
  const { document, form, setForm, isDirty, isPending, submit } =
    usePresetDraftSession({
      sessionKey,
      ...(presetId ? { presetId } : {}),
      hydrateFromQueryOnMount: true,
      ...(onCreated ? { onCreated } : {}),
    });
  const settings = form.modelSettings;
  const entryById = new Map(document.entries.map((entry) => [entry.id, entry]));
  const tokenCount = document.promptItems.reduce((total, item) => {
    const entry = entryById.get(item.entryId);
    return (
      total + (item.enabled && entry ? countPromptTokens(entry.content) : 0)
    );
  }, 0);

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
              tokenCount,
              entryCount: document.entries.length,
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
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <PresetSelectField
              disabled={isPending}
              id={`${fieldPrefix}-visibility`}
              label={t("presets.editor.fields.visibility")}
              options={[
                {
                  value: "private",
                  label: t("presets.list.privateVisibility"),
                },
                {
                  value: "public",
                  label: t("presets.list.publicVisibility"),
                },
              ]}
              value={form.visibility}
              onChange={(visibility) => setForm({ ...form, visibility })}
            />
            <PresetModelProviderField
              disabled={isPending}
              id={`${fieldPrefix}-model-provider`}
              value={form.modelProviderId}
              onChange={(modelProviderId) =>
                setForm({ ...form, modelProviderId })
              }
            />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric
                label={t("presets.metrics.totalTokens")}
                value={String(tokenCount)}
              />
              <Metric
                label={t("presets.metrics.entryCount")}
                value={String(document.entries.length)}
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

      {submitLabel ? (
        <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
          <FormSubmitButton disabled={isPending || !isDirty}>
            {submitLabel}
          </FormSubmitButton>
        </div>
      ) : null}
    </form>
  );
}

function PresetModelProviderField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const providersQuery = useQuery({
    queryKey: ["model-providers", "preset-options"],
    queryFn: listAllModelProviders,
  });
  const providers = providersQuery.data ?? [];
  const selectedProviderUnavailable =
    value !== null &&
    providersQuery.isSuccess &&
    !providers.some((provider) => provider.id === value);
  const invalid = providersQuery.isError || selectedProviderUnavailable;
  const selectDisabled =
    disabled || providersQuery.isLoading || providers.length === 0;
  const placeholder = providersQuery.isLoading
    ? t("presets.editor.modelProviderLoading")
    : providers.length === 0
      ? t("presets.editor.noModelProviders")
      : t("presets.editor.unlinkedProvider");

  return (
    <Field
      data-disabled={disabled || providersQuery.isLoading}
      data-invalid={invalid}
    >
      <FieldLabel htmlFor={id}>
        {t("presets.editor.fields.modelProvider")}
      </FieldLabel>
      <div className="flex min-w-0 items-center gap-2">
        <Select
          disabled={selectDisabled}
          value={value ?? ""}
          onValueChange={onChange}
        >
          <SelectTrigger
            aria-invalid={invalid}
            className="min-w-0 flex-1"
            id={id}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name} · {provider.providerKind} ·{" "}
                  {provider.defaultModelName ||
                    t("presets.editor.noDefaultModel")}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={t("presets.editor.clearModelProvider")}
                disabled={disabled || value === null}
                size="icon"
                type="button"
                variant="outline"
                onClick={() => onChange(null)}
              >
                <XIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t("presets.editor.clearModelProvider")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {providersQuery.isError ? (
        <FieldError>{t("presets.editor.modelProvidersLoadFailed")}</FieldError>
      ) : selectedProviderUnavailable ? (
        <FieldError>
          {t("presets.editor.selectedModelProviderUnavailable")}
        </FieldError>
      ) : null}
    </Field>
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
      <div className="truncate text-base font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

const modelNumberFields = [
  { key: "temperature", labelKey: "presets.editor.fields.temperature" },
  { key: "presencePenalty", labelKey: "presets.editor.fields.presencePenalty" },
  {
    key: "frequencyPenalty",
    labelKey: "presets.editor.fields.frequencyPenalty",
  },
  {
    key: "repetitionPenalty",
    labelKey: "presets.editor.fields.repetitionPenalty",
  },
  { key: "topP", labelKey: "presets.editor.fields.topP" },
  { key: "topK", labelKey: "presets.editor.fields.topK" },
  { key: "minP", labelKey: "presets.editor.fields.minP" },
  { key: "topA", labelKey: "presets.editor.fields.topA" },
  { key: "seed", labelKey: "presets.editor.fields.seed" },
  { key: "n", labelKey: "presets.editor.fields.n" },
] as const;
