import { useMutation, useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Activity, BadgeInfo, Bot } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion } from "../../../components/ui/accordion";
import { Button } from "../../../components/ui/button";
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
import { ModelProviderCredentialField } from "./model-provider-credential-field";

export interface ModelProviderMainEditorProps {
  sessionKey: string;
  configId?: string;
  submitLabel: string;
  onCreated?: (config: ModelProviderDetailResponse) => void;
  onManageApiKeys: () => void;
}

export function ModelProviderMainEditor({
  sessionKey,
  configId,
  submitLabel,
  onCreated,
  onManageApiKeys,
}: ModelProviderMainEditorProps) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const [openSections, setOpenSections] = useState<string[]>([
    "basic",
    "model",
    "test",
  ]);
  const { form, setForm, isPending, visibleError, submit } =
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
  const modelOpen = openSections.includes("model");
  const connectionKey = [
    form.providerKind,
    form.baseUrl,
    form.credentialMode,
    form.secret,
    form.apiKeyId,
  ] as const;
  const modelsQuery = useQuery({
    enabled: modelOpen && Boolean(form.baseUrl.trim()),
    queryKey: ["model-provider-models-preview", ...connectionKey],
    queryFn: () =>
      previewModelProviderModels({
        providerKind: form.providerKind,
        baseUrl: form.baseUrl,
        ...(form.credentialMode === "vault" && form.apiKeyId
          ? { apiKeyId: form.apiKeyId }
          : {}),
        ...(form.credentialMode === "manual" && form.secret
          ? { apiKeySecret: form.secret }
          : {}),
      }),
    select: (result) =>
      [...result.models].sort((left, right) => left.localeCompare(right)),
  });
  const testMutation = useMutation({
    mutationFn: () =>
      previewTestModelProviderConnection({
        providerKind: form.providerKind,
        baseUrl: form.baseUrl,
        defaultModelName: form.defaultModelName,
        ...(form.credentialMode === "vault" && form.apiKeyId
          ? { apiKeyId: form.apiKeyId }
          : {}),
        ...(form.credentialMode === "manual" && form.secret
          ? { apiKeySecret: form.secret }
          : {}),
      }),
  });

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
            summary={basicSummary(form, selectedCatalogItem, t)}
            title={t("modelProviders.editor.sections.basic.title")}
            value="basic"
          >
            <ModelProviderTextField
              disabled={isPending}
              id={`${fieldPrefix}-name`}
              label={t("modelProviders.editor.fields.name")}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <ProviderSelect
              disabled={isPending || catalogQuery.isLoading}
              id={`${fieldPrefix}-provider`}
              items={catalogItems}
              label={t("modelProviders.editor.fields.provider")}
              value={form.providerKind}
              onChange={(providerKind) =>
                setForm(providerChanged(form, providerKind, catalogItems))
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
                disabled={isPending || !selectedCatalogItem}
                id={`${fieldPrefix}-base-url`}
                label={t("modelProviders.editor.fields.baseUrl")}
                options={(selectedCatalogItem?.baseUrls ?? []).map((value) => ({
                  value,
                  label: value,
                }))}
                value={form.baseUrl}
                onChange={(baseUrl) => setForm({ ...form, baseUrl })}
              />
            )}
            <ModelProviderCredentialField
              disabled={isPending}
              form={form}
              onChange={setForm}
              onManageApiKeys={onManageApiKeys}
            />
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
              label={t("modelProviders.editor.fields.model")}
              value={form.defaultModelName}
              onChange={(event) =>
                setForm({ ...form, defaultModelName: event.target.value })
              }
            />
            <RemoteModelSelect
              disabled={isPending}
              error={modelsQuery.error}
              id={`${fieldPrefix}-remote-model`}
              loading={modelsQuery.isFetching}
              models={modelsQuery.data}
              ready={Boolean(form.baseUrl.trim())}
              value={form.defaultModelName}
              onChange={(defaultModelName) => setForm({ ...form, defaultModelName })}
              onRetry={() => void modelsQuery.refetch()}
            />
          </ModelProviderFormSection>

          <ModelProviderFormSection
            icon={Activity}
            summary={testSummary(
              Boolean(form.baseUrl.trim()),
              Boolean(form.defaultModelName.trim()),
              Boolean(testMutation.error),
              testMutation.data?.elapsedMs,
              t,
            )}
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
            {testMutation.error ? (
              <FormError>
                {connectionErrorMessage(testMutation.error, t)}
              </FormError>
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

function RemoteModelSelect({
  id,
  models,
  loading,
  error,
  ready,
  disabled,
  value,
  onRetry,
  onChange,
}: {
  id: string;
  models: string[] | undefined;
  loading: boolean;
  error: Error | null;
  ready: boolean;
  disabled: boolean;
  value: string;
  onRetry: () => void;
  onChange: (model: string) => void;
}) {
  const { t } = useTranslation();
  const options = models ?? [];
  const description = loading
    ? t("modelProviders.editor.actions.fetchingModels")
    : error
      ? connectionErrorMessage(error, t)
      : t(
          ready
            ? options.length
              ? "modelProviders.editor.availableModels.count"
              : "modelProviders.editor.availableModels.empty"
            : "modelProviders.editor.availableModels.notReady",
          { count: options.length },
        );

  return (
    <>
      <ModelProviderSelectField
        description={description}
        disabled={disabled || loading || Boolean(error) || !ready || !options.length}
        id={id}
        label={t("modelProviders.editor.fields.modelCandidates")}
        options={options.map((model) => ({ value: model, label: model }))}
        placeholder={t("modelProviders.editor.fields.modelCandidates")}
        value={options.includes(value) ? value : ""}
        onChange={onChange}
      />
      {error ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          {t("modelProviders.editor.actions.retryModels")}
        </Button>
      ) : null}
    </>
  );
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
  return (
    <ModelProviderSelectField
      disabled={disabled}
      id={id}
      label={label}
      options={items.map((item) => ({
        value: item.kind,
        label: item.displayName,
      }))}
      value={value}
      onChange={onChange}
    />
  );
}

function providerChanged(
  form: ModelProviderEditorFormState,
  providerKind: ModelProviderKind,
  items: ModelProviderCatalogItem[],
): ModelProviderEditorFormState {
  const item = items.find((candidate) => candidate.kind === providerKind);
  return {
    ...form,
    providerKind,
    baseUrl: item?.allowCustomBaseUrl ? "" : (item?.baseUrls[0] ?? ""),
  };
}

function normalizeCatalogItem(
  item: ModelProviderCatalogItem,
): ModelProviderCatalogItem & { kind: ModelProviderKind } {
  return { ...item, kind: asModelProviderKind(item.kind) };
}
function basicSummary(
  form: ModelProviderEditorFormState,
  item: ModelProviderCatalogItem | undefined,
  t: TFunction,
): string {
  const host = hostFromBaseUrl(form.baseUrl);
  const provider = item?.displayName ?? form.providerKind;
  const credential =
    form.credentialMode === "vault"
      ? (form.apiKeyName ?? t("modelProviders.editor.summaries.noKey"))
      : t("modelProviders.editor.credentials.manual");
  return [
    form.name.trim(),
    host ? `${provider} · ${host}` : provider,
    credential,
  ]
    .filter(Boolean)
    .join(" · ");
}
function hostFromBaseUrl(value: string): string {
  if (!value.trim()) return "";
  try {
    return new URL(value.trim()).host;
  } catch {
    return value.trim();
  }
}
function testSummary(
  hasBaseUrl: boolean,
  hasModel: boolean,
  hasError: boolean,
  elapsedMs: number | undefined,
  t: TFunction,
): string {
  if (elapsedMs !== undefined)
    return t("modelProviders.editor.summaries.testConnected", {
      elapsed: elapsedMs,
    });
  if (hasError) return t("modelProviders.editor.summaries.testFailed");
  return hasBaseUrl && hasModel
    ? t("modelProviders.editor.summaries.testReady")
    : t("modelProviders.editor.summaries.testNotReady");
}
function connectionErrorMessage(error: Error, t: TFunction): string {
  return error instanceof ApiError
    ? formatApiMessage(error.message, error.envelope?.data ?? {})
    : t("modelProviders.editor.errors.connectionFailed");
}
