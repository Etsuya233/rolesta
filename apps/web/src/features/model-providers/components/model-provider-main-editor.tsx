import { useMutation, useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { Activity, BadgeInfo, Bot, Boxes } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion } from "../../../components/ui/accordion";
import { Button } from "../../../components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../../components/ui/empty";
import { Skeleton } from "../../../components/ui/skeleton";
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
}

export function ModelProviderMainEditor({
  sessionKey,
  configId,
  submitLabel,
  onCreated,
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
  const availableOpen = openSections.includes("available-models");
  const connectionKey = [
    form.providerKind,
    form.baseUrl,
    form.credentialMode,
    form.secret,
    form.apiKeyId,
  ] as const;
  const modelsQuery = useQuery({
    enabled: availableOpen && Boolean(form.baseUrl.trim()),
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
              label={t("modelProviders.editor.fields.defaultModelName")}
              value={form.defaultModelName}
              onChange={(event) =>
                setForm({ ...form, defaultModelName: event.target.value })
              }
            />
          </ModelProviderFormSection>

          <ModelProviderFormSection
            icon={Boxes}
            summary={availableModelsSummary(
              modelsQuery.data?.length,
              modelsQuery.isFetching,
              t,
            )}
            title={t("modelProviders.editor.sections.availableModels.title")}
            value="available-models"
          >
            <AvailableModels
              models={modelsQuery.data}
              loading={modelsQuery.isFetching}
              error={modelsQuery.error}
              ready={Boolean(form.baseUrl.trim())}
              onRetry={() => void modelsQuery.refetch()}
              onSelect={(defaultModelName) =>
                setForm({ ...form, defaultModelName })
              }
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

function AvailableModels({
  models,
  loading,
  error,
  ready,
  onRetry,
  onSelect,
}: {
  models: string[] | undefined;
  loading: boolean;
  error: Error | null;
  ready: boolean;
  onRetry: () => void;
  onSelect: (model: string) => void;
}) {
  const { t } = useTranslation();
  if (loading)
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    );
  if (error)
    return (
      <Empty className="min-h-40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Boxes />
          </EmptyMedia>
          <EmptyTitle>
            {t("modelProviders.editor.availableModels.loadFailed")}
          </EmptyTitle>
          <EmptyDescription>
            {connectionErrorMessage(error, t)}
          </EmptyDescription>
        </EmptyHeader>
        <Button type="button" variant="outline" onClick={onRetry}>
          {t("modelProviders.editor.actions.retryModels")}
        </Button>
      </Empty>
    );
  if (!ready || !models?.length)
    return (
      <Empty className="min-h-40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Boxes />
          </EmptyMedia>
          <EmptyTitle>
            {t(
              ready
                ? "modelProviders.editor.availableModels.empty"
                : "modelProviders.editor.availableModels.notReady",
            )}
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  return (
    <div className="flex max-h-72 flex-col overflow-y-auto border-y border-border">
      {models.map((model) => (
        <Button
          key={model}
          className="h-9 shrink-0 justify-start rounded-none border-b border-border px-3 font-normal last:border-b-0"
          type="button"
          variant="ghost"
          onClick={() => onSelect(model)}
        >
          <span className="truncate">{model}</span>
        </Button>
      ))}
    </div>
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
function availableModelsSummary(
  count: number | undefined,
  loading: boolean,
  t: TFunction,
): string {
  if (loading) return t("modelProviders.editor.actions.fetchingModels");
  return count === undefined
    ? t("modelProviders.editor.availableModels.lazy")
    : t("modelProviders.editor.availableModels.count", { count });
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
