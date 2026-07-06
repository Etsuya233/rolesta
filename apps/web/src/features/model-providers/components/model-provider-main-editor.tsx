import { useMutation, useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Activity, BadgeInfo, Bot, ChevronRight, Globe2, KeyRound } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion } from "../../../components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { ApiError } from "../../../lib/api/client";
import { formatApiMessage } from "../../../lib/i18n/api-error-message";
import {
  getModelProviderCatalog,
  previewModelProviderModels,
  previewTestModelProviderConnection,
  type ModelProviderCatalogItem,
  type ModelProviderDetailResponse,
  type ModelProviderKind,
} from "../api/model-providers-api";
import { useModelProviderDraftSession } from "../hooks/use-model-provider-draft-sessions";
import {
  asModelProviderKind,
  type ModelProviderEditorFormState,
} from "../model/model-provider-editor-form";
import {
  FormActionButton,
  FormError,
  FormNotice,
  FormSubmitButton,
  ModelProviderFormSection,
  ModelProviderSelectField,
  ModelProviderTextField,
} from "./model-provider-form-fields";

export interface ModelProviderMainEditorProps {
  sessionKey: string;
  configId?: string;
  submitLabel: string;
  onCreated?: (config: ModelProviderDetailResponse) => void;
  onOpenApiKeys?: (apiKeyId?: string) => void;
}

export function ModelProviderMainEditor({
  sessionKey,
  configId,
  submitLabel,
  onCreated,
  onOpenApiKeys,
}: ModelProviderMainEditorProps) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const [openSections, setOpenSections] = useState<string[]>([
    "basic",
    "provider",
    "model",
    "test",
  ]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const { form, setForm, isPending, visibleError, config, submit } =
    useModelProviderDraftSession({
      sessionKey,
      ...(configId ? { configId } : {}),
      ...(onCreated ? { onCreated } : {}),
    });
  const catalogQuery = useQuery({
    queryKey: ["model-provider-catalog"],
    queryFn: getModelProviderCatalog,
  });
  const catalogItems = useMemo(
    () => catalogQuery.data?.items.map(normalizeCatalogItem) ?? [],
    [catalogQuery.data],
  );
  const selectedCatalogItem = catalogItems.find(
    (item) => item.kind === form.providerKind,
  );
  const selectedApiKeySecret = config?.apiKeys.find(
    (apiKey) => apiKey.id === config.selectedApiKeyId,
  )?.secret;
  const selectedApiKeyName = config?.apiKeys.find(
    (apiKey) => apiKey.id === config.selectedApiKeyId,
  )?.name;
  const listModelsMutation = useMutation({
    mutationFn: () =>
      previewModelProviderModels({
        providerKind: form.providerKind,
        baseUrl: form.baseUrl,
        ...(configId && selectedApiKeySecret
          ? { apiKeySecret: selectedApiKeySecret }
          : {}),
      }),
    onSuccess(result) {
      setModelOptions(result.models);
    },
  });
  const testMutation = useMutation({
    mutationFn: () =>
      previewTestModelProviderConnection({
        providerKind: form.providerKind,
        baseUrl: form.baseUrl,
        defaultModelName: form.defaultModelName,
        ...(selectedApiKeySecret ? { apiKeySecret: selectedApiKeySecret } : {}),
      }),
  });
  const connectionError = listModelsMutation.error ?? testMutation.error;
  const baseUrlHost = hostFromBaseUrl(form.baseUrl);

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
          <ModelProviderFormSection
            icon={BadgeInfo}
            summary={basicSectionSummary({
              name: form.name,
              selectedApiKeyName,
              t,
            })}
            title={t("modelProviders.editor.sections.basic.title")}
            value="basic"
          >
            <ModelProviderTextField
              disabled={isPending}
              id={`${fieldPrefix}-name`}
              label={t("modelProviders.editor.fields.name")}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            {onOpenApiKeys ? (
              <ApiKeySummaryButton
                disabled={isPending}
                label={t("modelProviders.apiKeys.title")}
                value={
                  selectedApiKeyName ??
                  t("modelProviders.editor.summaries.noKey")
                }
                onClick={() => onOpenApiKeys(config?.selectedApiKeyId ?? undefined)}
              />
            ) : null}
          </ModelProviderFormSection>

          <ModelProviderFormSection
            icon={Globe2}
            summary={
              baseUrlHost
                ? `${selectedCatalogItem?.displayName ?? form.providerKind} · ${baseUrlHost}`
                : t("modelProviders.editor.summaries.noBaseUrl")
            }
            title={t("modelProviders.editor.sections.provider.title")}
            value="provider"
          >
            <ProviderSelect
              disabled={isPending || catalogQuery.isLoading}
              id={`${fieldPrefix}-provider`}
              items={catalogItems}
              label={t("modelProviders.editor.fields.provider")}
              value={form.providerKind}
              onChange={(providerKind) =>
                handleProviderChange({
                  form,
                  providerKind,
                  catalogItems,
                  setForm,
                })
              }
            />
            {selectedCatalogItem?.allowCustomBaseUrl ? (
              <ModelProviderTextField
                disabled={isPending}
                id={`${fieldPrefix}-base-url`}
                label={t("modelProviders.editor.fields.baseUrl")}
                placeholder="https://example.com/v1"
                value={form.baseUrl}
                onChange={(event) =>
                  setForm({ ...form, baseUrl: event.target.value })
                }
              />
            ) : (
              <ModelProviderSelectField
                disabled={isPending || selectedCatalogItem === undefined}
                id={`${fieldPrefix}-base-url`}
                label={t("modelProviders.editor.fields.baseUrl")}
                options={(selectedCatalogItem?.baseUrls ?? []).map((baseUrl) => ({
                  value: baseUrl,
                  label: baseUrl,
                }))}
                value={form.baseUrl}
                onChange={(baseUrl) => setForm({ ...form, baseUrl })}
              />
            )}
          </ModelProviderFormSection>

          <ModelProviderFormSection
            icon={Bot}
            summary={
              form.defaultModelName.trim() ||
              t("modelProviders.editor.summaries.noModel")
            }
            title={t("modelProviders.editor.sections.model.title")}
            value="model"
          >
            <ModelProviderTextField
              disabled={isPending}
              id={`${fieldPrefix}-model-name`}
              label={t("modelProviders.editor.fields.defaultModelName")}
              value={form.defaultModelName}
              onChange={(event) =>
                setForm({ ...form, defaultModelName: event.target.value })
              }
            />
            <FormActionButton
              disabled={listModelsMutation.isPending || !form.baseUrl.trim()}
              onClick={() => listModelsMutation.mutate()}
            >
              {listModelsMutation.isPending
                ? t("modelProviders.editor.actions.fetchingModels")
                : t("modelProviders.editor.actions.fetchModels")}
            </FormActionButton>
            {modelOptions.length > 0 ? (
              <ModelProviderSelectField
                id={`${fieldPrefix}-model-options`}
                label={t("modelProviders.editor.fields.modelCandidates")}
                options={modelOptions.map((modelName) => ({
                  value: modelName,
                  label: modelName,
                }))}
                value={
                  modelOptions.includes(form.defaultModelName)
                    ? form.defaultModelName
                    : (modelOptions[0] ?? "")
                }
                onChange={(defaultModelName) =>
                  setForm({ ...form, defaultModelName })
                }
              />
            ) : null}
          </ModelProviderFormSection>

          <ModelProviderFormSection
            icon={Activity}
            summary={testSectionSummary({
              hasBaseUrl: Boolean(form.baseUrl.trim()),
              hasModel: Boolean(form.defaultModelName.trim()),
              hasError: Boolean(connectionError),
              elapsedMs: testMutation.data?.elapsedMs,
              t,
            })}
            title={t("modelProviders.editor.sections.test.title")}
            value="test"
          >
            <FormActionButton
              disabled={
                testMutation.isPending ||
                !form.baseUrl.trim() ||
                !form.defaultModelName.trim()
              }
              onClick={() => testMutation.mutate()}
            >
              {testMutation.isPending
                ? t("modelProviders.editor.actions.testing")
                : t("modelProviders.editor.actions.testConnection")}
            </FormActionButton>
            {testMutation.data ? (
              <FormNotice>
                {t("modelProviders.editor.testSuccess", {
                  model: testMutation.data.modelName,
                  elapsed: testMutation.data.elapsedMs,
                  id: testMutation.data.remoteResponseId ?? "-",
                })}
              </FormNotice>
            ) : null}
            {connectionError ? (
              <FormError>{connectionErrorMessage(connectionError, t)}</FormError>
            ) : null}
          </ModelProviderFormSection>
        </Accordion>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        {visibleError ? <FormError>{visibleError}</FormError> : null}
        <FormSubmitButton disabled={isPending}>{submitLabel}</FormSubmitButton>
      </div>
    </form>
  );
}

function ApiKeySummaryButton({
  label,
  value,
  disabled,
  onClick,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <KeyRound aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium">{value}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function hostFromBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();

  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed).host;
  } catch {
    return trimmed;
  }
}

function basicSectionSummary({
  name,
  selectedApiKeyName,
  t,
}: {
  name: string;
  selectedApiKeyName: string | undefined;
  t: TFunction;
}): string {
  const trimmedName = name.trim();
  const keySummary = selectedApiKeyName
    ? t("modelProviders.editor.summaries.selectedKey", {
        name: selectedApiKeyName,
      })
    : t("modelProviders.editor.summaries.noKey");

  return trimmedName ? `${trimmedName} · ${keySummary}` : keySummary;
}

function testSectionSummary({
  hasBaseUrl,
  hasModel,
  hasError,
  elapsedMs,
  t,
}: {
  hasBaseUrl: boolean;
  hasModel: boolean;
  hasError: boolean;
  elapsedMs: number | undefined;
  t: TFunction;
}): string {
  if (elapsedMs !== undefined) {
    return t("modelProviders.editor.summaries.testConnected", { elapsed: elapsedMs });
  }

  if (hasError) {
    return t("modelProviders.editor.summaries.testFailed");
  }

  if (hasBaseUrl && hasModel) {
    return t("modelProviders.editor.summaries.testReady");
  }

  return t("modelProviders.editor.summaries.testNotReady");
}

function ProviderSelect({
  id,
  label,
  items,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  items: ModelProviderCatalogItem[];
  value: ModelProviderKind;
  disabled: boolean;
  onChange: (value: ModelProviderKind) => void;
}) {
  const { t } = useTranslation();
  const customItems = items.filter((item) => item.source === "custom");
  const officialItems = items.filter((item) => item.source === "official");

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Select
        disabled={disabled}
        value={value}
        onValueChange={(next) => onChange(asModelProviderKind(next))}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>
              {t("modelProviders.providerGroups.custom")}
            </SelectLabel>
            {customItems.map((item) => (
              <SelectItem key={item.kind} value={item.kind}>
                {item.displayName}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>
              {t("modelProviders.providerGroups.official")}
            </SelectLabel>
            {officialItems.map((item) => (
              <SelectItem key={item.kind} value={item.kind}>
                {item.displayName}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function connectionErrorMessage(error: Error, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    return formatApiMessage(error.message, error.envelope?.data ?? {});
  }

  return t("modelProviders.editor.errors.connectionFailed");
}

function normalizeCatalogItem(
  item: ModelProviderCatalogItem,
): ModelProviderCatalogItem & { kind: ModelProviderKind } {
  return { ...item, kind: asModelProviderKind(item.kind) };
}

function handleProviderChange({
  form,
  providerKind,
  catalogItems,
  setForm,
}: {
  form: ModelProviderEditorFormState;
  providerKind: ModelProviderKind;
  catalogItems: ModelProviderCatalogItem[];
  setForm: (form: ModelProviderEditorFormState) => void;
}) {
  const catalogItem = catalogItems.find((item) => item.kind === providerKind);
  const baseUrl = catalogItem?.allowCustomBaseUrl
    ? ""
    : catalogItem?.baseUrls[0] ?? "";

  setForm({ ...form, providerKind, baseUrl });
}
