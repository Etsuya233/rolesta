import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../../components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { AssetSortMenu } from "../../assets/components/asset-sort-menu";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import {
  createModelProviderApiKey,
  deleteModelProviderApiKey,
  getApiKeyReferenceCount,
  listApiKeys,
  updateModelProviderApiKey,
  type ModelProviderApiKeyResponse,
} from "../api/model-providers-api";
import { useModelProviderDraftSessionActions } from "../hooks/use-model-provider-draft-sessions";
import {
  sortApiKeys,
  type ApiKeySortDirection,
  type ApiKeySortKey,
} from "../model/model-provider-api-key-sort";
import { ModelProviderStackPage } from "./model-provider-stack-page";

export function ModelProviderApiKeyManagementPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { clearApiKeyReferences } = useModelProviderDraftSessionActions();
  const [sort, setSort] = useState<ApiKeySortKey>("updatedAtMs");
  const [direction, setDirection] =
    useState<ApiKeySortDirection>("desc");
  const [editor, setEditor] = useState<ModelProviderApiKeyResponse | "create" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<ModelProviderApiKeyResponse | null>(null);
  const query = useQuery({ queryKey: ["api-keys"], queryFn: listApiKeys });
  const references = useQuery({
    enabled: deleteTarget !== null,
    queryKey: ["api-key-references", deleteTarget?.id],
    queryFn: () => getApiKeyReferenceCount(deleteTarget!.id),
  });
  const items = useMemo(
    () => sortApiKeys(query.data?.items ?? [], sort, direction, i18n.language),
    [direction, i18n.language, query.data?.items, sort],
  );
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteModelProviderApiKey(id),
    async onSuccess(_, id) {
      clearApiKeyReferences(id);
      setDeleteTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
        queryClient.invalidateQueries({ queryKey: ["model-providers"] }),
        queryClient.invalidateQueries({ queryKey: ["model-provider"] }),
      ]);
    },
  });
  const sortOptions: Array<{ value: ApiKeySortKey; label: string }> = [
    { value: "updatedAtMs", label: t("modelProviders.apiKeys.sort.updatedAt") },
    { value: "createdAtMs", label: t("modelProviders.apiKeys.sort.createdAt") },
    { value: "name", label: t("modelProviders.apiKeys.sort.name") },
  ];

  return (
    <ModelProviderStackPage>
      <MobileTopBar
        actions={
          <Button
            aria-label={t("modelProviders.apiKeys.createAction")}
            className="size-10"
            size="icon-lg"
            type="button"
            variant="ghost"
            onClick={() => setEditor("create")}
          >
            <Plus aria-hidden="true" />
          </Button>
        }
        title={t("modelProviders.apiKeys.title")}
        onBack={onBack}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border p-4">
          <AssetSortMenu
            direction={direction}
            options={sortOptions}
            sort={sort}
            onDirectionChange={setDirection}
            onSortChange={setSort}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {query.isLoading ? (
            <div className="flex flex-col gap-px">
              <Skeleton className="h-14 rounded-none" />
              <Skeleton className="h-14 rounded-none" />
            </div>
          ) : null}
          {query.isError ? (
            <Empty className="min-h-48">
              <EmptyHeader>
                <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                <EmptyTitle>{t("modelProviders.apiKeys.loadFailed")}</EmptyTitle>
              </EmptyHeader>
              <Button type="button" variant="outline" onClick={() => void query.refetch()}>
                {t("modelProviders.apiKeys.retryAction")}
              </Button>
            </Empty>
          ) : null}
          {query.isSuccess && items.length === 0 ? (
            <Empty className="min-h-48">
              <EmptyHeader>
                <EmptyMedia variant="icon"><KeyRound /></EmptyMedia>
                <EmptyTitle>{t("modelProviders.apiKeys.empty")}</EmptyTitle>
                <EmptyDescription>{t("modelProviders.apiKeys.emptyDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
          <TooltipProvider>
            {items.map((apiKey) => (
              <ApiKeyListItem
                key={apiKey.id}
                apiKey={apiKey}
                locale={i18n.language}
                onDelete={() => setDeleteTarget(apiKey)}
                onEdit={() => setEditor(apiKey)}
              />
            ))}
          </TooltipProvider>
        </div>
      </div>
      {editor ? (
        <ApiKeyEditorDialog
          key={editor === "create" ? "create" : editor.id}
          editor={editor}
          onClose={() => setEditor(null)}
        />
      ) : null}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("modelProviders.apiKeys.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {references.isError
                ? t("modelProviders.apiKeys.referenceLoadFailed")
                : t("modelProviders.apiKeys.deleteConfirmDescription", {
                    name: deleteTarget?.name,
                    count: references.data?.affectedProviderCount ?? 0,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <Button
              disabled={references.isLoading || references.isError || deleteMutation.isPending}
              type="button"
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {t("modelProviders.apiKeys.deleteAction")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModelProviderStackPage>
  );
}

function ApiKeyListItem({
  apiKey,
  locale,
  onEdit,
  onDelete,
}: {
  apiKey: ModelProviderApiKeyResponse;
  locale: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-border px-4 py-2">
      <KeyRound aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{apiKey.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {t("modelProviders.apiKeys.updatedAt", {
            value: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(apiKey.updatedAtMs),
          })}
        </p>
      </div>
      <IconTooltip label={t("modelProviders.apiKeys.editAction")} onClick={onEdit}>
        <Pencil aria-hidden="true" />
      </IconTooltip>
      <IconTooltip label={t("modelProviders.apiKeys.deleteAction")} onClick={onDelete}>
        <Trash2 aria-hidden="true" />
      </IconTooltip>
    </div>
  );
}

function IconTooltip({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button aria-label={label} size="icon-sm" type="button" variant="ghost" onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ApiKeyEditorDialog({
  editor,
  onClose,
}: {
  editor: ModelProviderApiKeyResponse | "create";
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(editor === "create" ? "" : editor.name);
  const [secret, setSecret] = useState("");
  const editing = editor === "create" ? null : editor;
  const mutation = useMutation({
    mutationFn: () =>
      editing
        ? updateModelProviderApiKey(editing.id, { name, ...(secret ? { secret } : {}) })
        : createModelProviderApiKey({ name, secret }),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      onClose();
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(editing ? "modelProviders.apiKeys.editTitle" : "modelProviders.apiKeys.createTitle")}</DialogTitle>
          <DialogDescription>{t(editing ? "modelProviders.apiKeys.editDescription" : "modelProviders.apiKeys.createDescription")}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="api-key-name">{t("modelProviders.apiKeys.fields.name")}</FieldLabel>
            <Input id="api-key-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="api-key-secret">{t("modelProviders.apiKeys.fields.secret")}</FieldLabel>
            <Input
              autoComplete="off"
              className="[-webkit-text-security:disc]"
              id="api-key-secret"
              placeholder={editing ? t("modelProviders.apiKeys.replaceSecret") : undefined}
              type="text"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
            />
          </Field>
        </FieldGroup>
        {mutation.isError ? <p className="text-sm text-destructive">{t("modelProviders.apiKeys.errors.saveFailed")}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            disabled={!name.trim() || (!editing && !secret) || mutation.isPending}
            type="button"
            onClick={() => mutation.mutate()}
          >
            {t(editing ? "modelProviders.apiKeys.saveAction" : "modelProviders.apiKeys.createAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
