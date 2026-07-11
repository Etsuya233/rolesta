import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
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
import { Input } from "../../../components/ui/input";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  createModelProviderApiKey,
  deleteModelProviderApiKey,
  getApiKeyReferenceCount,
  listApiKeys,
  updateModelProviderApiKey,
  type ModelProviderApiKeyResponse,
} from "../api/model-providers-api";

export function ModelProviderApiKeyVaultDialog({
  open,
  selectedApiKeyId,
  onOpenChange,
  onSelect,
  onSelectedKeyDeleted,
}: {
  open: boolean;
  selectedApiKeyId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (apiKey: ModelProviderApiKeyResponse) => void;
  onSelectedKeyDeleted: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<ModelProviderApiKeyResponse | null>(null);
  const query = useQuery({
    enabled: open,
    queryKey: ["api-keys"],
    queryFn: listApiKeys,
  });
  const references = useQuery({
    enabled: deleteTarget !== null,
    queryKey: ["api-key-references", deleteTarget?.id],
    queryFn: () => getApiKeyReferenceCount(deleteTarget!.id),
  });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
  };
  const createMutation = useMutation({
    mutationFn: () =>
      createModelProviderApiKey({ name: newName, secret: newSecret }),
    onSuccess: async () => {
      setNewName("");
      setNewSecret("");
      await refresh();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      secret,
    }: {
      id: string;
      name: string;
      secret?: string;
    }) =>
      updateModelProviderApiKey(id, { name, ...(secret ? { secret } : {}) }),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteModelProviderApiKey(id),
    onSuccess: async (_, id) => {
      if (selectedApiKeyId === id) onSelectedKeyDeleted();
      setDeleteTarget(null);
      await Promise.all([
        refresh(),
        queryClient.invalidateQueries({ queryKey: ["model-providers"] }),
        queryClient.invalidateQueries({ queryKey: ["model-provider"] }),
      ]);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 p-0">
          <DialogHeader className="p-4">
            <DialogTitle>{t("modelProviders.apiKeys.title")}</DialogTitle>
            <DialogDescription>
              {t("modelProviders.apiKeys.description")}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="min-h-0 max-h-[70vh] border-t border-border">
            <div className="flex flex-col">
              <section className="grid gap-4 border-b border-border p-4">
                <h3 className="text-sm font-semibold">
                  {t("modelProviders.apiKeys.createTitle")}
                </h3>
                <label className="grid gap-2 text-sm font-medium">
                  {t("modelProviders.apiKeys.fields.name")}
                  <Input
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  {t("modelProviders.apiKeys.fields.secret")}
                  <Input
                    type="password"
                    value={newSecret}
                    onChange={(event) => setNewSecret(event.target.value)}
                  />
                </label>
                <Button
                  disabled={
                    !newName.trim() || !newSecret || createMutation.isPending
                  }
                  type="button"
                  onClick={() => createMutation.mutate()}
                >
                  {t("modelProviders.apiKeys.createAction")}
                </Button>
              </section>
              {query.isLoading ? (
                <>
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </>
              ) : null}
              {query.data?.items.length === 0 ? (
                <Empty className="min-h-36">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <KeyRound />
                    </EmptyMedia>
                    <EmptyTitle>{t("modelProviders.apiKeys.empty")}</EmptyTitle>
                    <EmptyDescription>
                      {t("modelProviders.apiKeys.emptyDescription")}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}
              {query.data?.items.map((apiKey) => (
                <ApiKeyRow
                  key={apiKey.id}
                  apiKey={apiKey}
                  selected={selectedApiKeyId === apiKey.id}
                  pending={updateMutation.isPending}
                  onSelect={() => {
                    onSelect(apiKey);
                    onOpenChange(false);
                  }}
                  onSave={(name, secret) =>
                    updateMutation.mutate({
                      id: apiKey.id,
                      name,
                      ...(secret ? { secret } : {}),
                    })
                  }
                  onDelete={() => setDeleteTarget(apiKey)}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("modelProviders.apiKeys.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("modelProviders.apiKeys.deleteConfirmDescription", {
                name: deleteTarget?.name,
                count: references.data?.affectedProviderCount ?? 0,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={references.isLoading || deleteMutation.isPending}
              type="button"
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {t("modelProviders.apiKeys.deleteAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ApiKeyRow({
  apiKey,
  selected,
  pending,
  onSelect,
  onSave,
  onDelete,
}: {
  apiKey: ModelProviderApiKeyResponse;
  selected: boolean;
  pending: boolean;
  onSelect: () => void;
  onSave: (name: string, secret: string) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(apiKey.name);
  const [secret, setSecret] = useState("");
  return (
    <section className="grid gap-3 border-b border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <KeyRound className="size-4 text-muted-foreground" />
          <span className="truncate">{apiKey.name}</span>
        </span>
        {selected ? (
          <Badge variant="secondary">
            {t("modelProviders.apiKeys.currentBadge")}
          </Badge>
        ) : null}
      </div>
      <label className="grid gap-2 text-sm font-medium">
        {t("modelProviders.apiKeys.fields.name")}
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        {t("modelProviders.apiKeys.fields.secret")}
        <Input
          placeholder={t("modelProviders.apiKeys.replaceSecret")}
          type="password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2">
        <Button
          disabled={selected}
          type="button"
          variant="secondary"
          onClick={onSelect}
        >
          {t("modelProviders.apiKeys.selectAction")}
        </Button>
        <Button
          disabled={pending || !name.trim()}
          type="button"
          variant="outline"
          onClick={() => onSave(name, secret)}
        >
          {t("modelProviders.apiKeys.saveAction")}
        </Button>
        <Button
          aria-label={t("modelProviders.apiKeys.deleteAction")}
          type="button"
          variant="outline"
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </section>
  );
}
