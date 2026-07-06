import { Check, Clipboard, KeyRound, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import {
  createModelProviderApiKey,
  deleteModelProviderApiKey,
  getModelProvider,
  setSelectedModelProviderApiKey,
  updateModelProviderApiKey,
  type ModelProviderApiKeyResponse,
  type ModelProviderDetailResponse,
} from "../api/model-providers-api";
import { FormError, ModelProviderTextField } from "./model-provider-form-fields";
import type { ModelProviderPage } from "./model-provider-pages";
import { ModelProviderStackPage } from "./model-provider-stack-page";

export function ModelProviderApiKeysPage({
  page,
  onBack,
}: {
  page: Extract<ModelProviderPage, { name: "apiKeys" }>;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [visibleError, setVisibleError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["model-provider", page.configId],
    queryFn: () => getModelProvider(page.configId),
  });
  const updateCachedConfig = (config: ModelProviderDetailResponse) => {
    queryClient.setQueryData(["model-provider", config.id], config);
    void queryClient.invalidateQueries({ queryKey: ["model-providers"] });
  };
  const createMutation = useMutation({
    mutationFn: () =>
      createModelProviderApiKey(page.configId, {
        name: newName,
        secret: newSecret,
      }),
    onSuccess(config) {
      updateCachedConfig(config);
      setNewName("");
      setNewSecret("");
      setVisibleError(null);
    },
  });
  const selectedMutation = useMutation({
    mutationFn: (selectedApiKeyId: string | null) =>
      setSelectedModelProviderApiKey(page.configId, selectedApiKeyId),
    onSuccess: updateCachedConfig,
  });

  return (
    <ModelProviderStackPage>
      <MobileTopBar title={t("modelProviders.apiKeys.title")} onBack={onBack} />
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="grid gap-4 border-b border-border p-4">
            <h2 className="text-sm font-semibold">
              {t("modelProviders.apiKeys.createTitle")}
            </h2>
            <ModelProviderTextField
              id="model-provider-api-key-new-name"
              label={t("modelProviders.apiKeys.fields.name")}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <ModelProviderTextField
              id="model-provider-api-key-new-secret"
              label={t("modelProviders.apiKeys.fields.secret")}
              type="password"
              value={newSecret}
              onChange={(event) => setNewSecret(event.target.value)}
            />
            {visibleError ? <FormError>{visibleError}</FormError> : null}
            {createMutation.isError ? (
              <FormError>{t("modelProviders.apiKeys.errors.saveFailed")}</FormError>
            ) : null}
            <Button
              disabled={
                createMutation.isPending || !newName.trim() || !newSecret
              }
              type="button"
              onClick={() => {
                if (!newName.trim() || !newSecret) {
                  setVisibleError(t("modelProviders.apiKeys.errors.required"));
                  return;
                }

                createMutation.mutate();
              }}
            >
              {t("modelProviders.apiKeys.createAction")}
            </Button>
          </section>

          {query.isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">
              {t("modelProviders.apiKeys.loading")}
            </p>
          ) : null}
          {query.isError ? (
            <p className="p-4 text-sm text-destructive">
              {t("modelProviders.apiKeys.loadFailed")}
            </p>
          ) : null}
          {query.data?.apiKeys.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {t("modelProviders.apiKeys.empty")}
            </p>
          ) : null}
          {query.data?.apiKeys.map((apiKey) => (
            <ApiKeyRow
              key={apiKey.id}
              apiKey={apiKey}
              config={query.data}
              isSelecting={selectedMutation.isPending}
              onConfigChanged={updateCachedConfig}
              onSelect={() => selectedMutation.mutate(apiKey.id)}
            />
          ))}
        </div>

        <div className="shrink-0 border-t border-border p-3">
          <Button
            className="w-full"
            disabled={selectedMutation.isPending}
            type="button"
            variant="outline"
            onClick={() => selectedMutation.mutate(null)}
          >
            {t("modelProviders.apiKeys.clearSelectedAction")}
          </Button>
        </div>
      </div>
    </ModelProviderStackPage>
  );
}

function ApiKeyRow({
  apiKey,
  config,
  isSelecting,
  onConfigChanged,
  onSelect,
}: {
  apiKey: ModelProviderApiKeyResponse;
  config: ModelProviderDetailResponse;
  isSelecting: boolean;
  onConfigChanged: (config: ModelProviderDetailResponse) => void;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(apiKey.name);
  const [secret, setSecret] = useState(apiKey.secret);
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
  const isSelected = config.selectedApiKeyId === apiKey.id;
  const updateMutation = useMutation({
    mutationFn: () =>
      updateModelProviderApiKey(config.id, apiKey.id, {
        name,
        secret,
      }),
    onSuccess: onConfigChanged,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteModelProviderApiKey(config.id, apiKey.id),
    onSuccess: onConfigChanged,
  });

  return (
    <section className="grid gap-3 border-b border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <KeyRound aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{apiKey.name}</span>
        </div>
        {isSelected ? (
          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            {t("modelProviders.apiKeys.currentBadge")}
          </span>
        ) : null}
      </div>
      <ModelProviderTextField
        id={`model-provider-api-key-name-${apiKey.id}`}
        label={t("modelProviders.apiKeys.fields.name")}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <ModelProviderTextField
        id={`model-provider-api-key-secret-${apiKey.id}`}
        label={t("modelProviders.apiKeys.fields.secret")}
        type="password"
        value={secret}
        onChange={(event) => setSecret(event.target.value)}
      />
      <div className="grid grid-cols-4 gap-2">
        <Button
          className="col-span-2"
          disabled={updateMutation.isPending || !name.trim() || !secret}
          type="button"
          variant="outline"
          onClick={() => updateMutation.mutate()}
        >
          {t("modelProviders.apiKeys.saveAction")}
        </Button>
        <Button
          aria-label={t("modelProviders.apiKeys.copyAction")}
          disabled={copyState === "done"}
          type="button"
          variant="outline"
          onClick={() => void copySecret(secret, setCopyState)}
        >
          {copyState === "done" ? (
            <Check aria-hidden="true" />
          ) : (
            <Clipboard aria-hidden="true" />
          )}
        </Button>
        <Button
          aria-label={t("modelProviders.apiKeys.deleteAction")}
          disabled={deleteMutation.isPending}
          type="button"
          variant="outline"
          onClick={() => deleteMutation.mutate()}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <Button
        disabled={isSelecting || isSelected}
        type="button"
        variant="secondary"
        onClick={onSelect}
      >
        {t("modelProviders.apiKeys.selectAction")}
      </Button>
      {copyState === "failed" ? (
        <p className="text-sm text-destructive">
          {t("modelProviders.apiKeys.errors.copyFailed")}
        </p>
      ) : null}
      {updateMutation.isError || deleteMutation.isError ? (
        <p className="text-sm text-destructive">
          {t("modelProviders.apiKeys.errors.saveFailed")}
        </p>
      ) : null}
    </section>
  );
}

async function copySecret(
  secret: string,
  setCopyState: (state: "idle" | "done" | "failed") => void,
) {
  try {
    await navigator.clipboard.writeText(secret);
    setCopyState("done");
    window.setTimeout(() => setCopyState("idle"), 1500);
  } catch {
    setCopyState("failed");
  }
}
