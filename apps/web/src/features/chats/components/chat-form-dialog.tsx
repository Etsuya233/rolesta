import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, RotateCwIcon } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "../../../components/ui/field";
import { Input } from "../../../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { ApiError } from "../../../lib/api/client";
import { cn } from "../../../lib/utils";
import { useCurrentUser } from "../../auth/hooks/use-current-user";
import { listCharacters } from "../../characters/api/characters-api";
import { useAssetDefaults } from "../../chat-preferences/hooks/use-asset-defaults";
import { listModelProviders } from "../../model-providers/api/model-providers-api";
import { getPreset, listPresets } from "../../presets/api/presets-api";
import type { ChatDetail } from "../api/chats-api";
import { useCreateChat, useUpdateChat } from "../hooks/use-chats";
import {
  applyAssetDefaults,
  applyOwnedPresetModel,
  editChatForm,
  editChatTitle,
  emptyCreateChatForm,
  isChatFormDirty,
  selectChatCharacter,
  selectModelProvider,
  selectPreset,
  validateChatEdit,
  validateChatForm,
  type ChatFormState,
} from "../model/chat-form";

interface ChatFormDialogProps {
  open: boolean;
  chat: ChatDetail | null;
  onOpenChange: (open: boolean) => void;
  onCreated: (chat: ChatDetail) => void;
  onUpdated?: ((chat: ChatDetail) => void) | undefined;
}

export function ChatFormDialog({
  open,
  chat,
  onOpenChange,
  onCreated,
  onUpdated,
}: ChatFormDialogProps) {
  const { t } = useTranslation();
  const editing = chat !== null;
  const [state, setState] = useState<ChatFormState>(() =>
    chat ? editChatForm(chat) : emptyCreateChatForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const defaults = useAssetDefaults();
  const currentUser = useCurrentUser();
  const createMutation = useCreateChat();
  const updateMutation = useUpdateChat();
  const presetDetail = useQuery({
    queryKey: ["chat-form", "preset", state.presetId],
    queryFn: () => getPreset(state.presetId!),
    enabled: open && state.presetId !== null,
  });

  useEffect(() => {
    if (open) {
      setState(chat ? editChatForm(chat) : emptyCreateChatForm());
      setFieldErrors({});
    }
  }, [chat, open]);

  useEffect(() => {
    if (!open || editing || !defaults.data) return;
    setState((current) => applyAssetDefaults(current, defaults.data));
  }, [defaults.data, editing, open]);

  useEffect(() => {
    const preset = presetDetail.data;
    const userId = currentUser.data?.user?.id;
    if (!preset || !userId || preset.ownerUserId !== userId) return;
    if (editing && !state.presetTouched) return;
    setState((current) => applyOwnedPresetModel(current, preset.modelProviderId));
  }, [currentUser.data?.user?.id, editing, presetDetail.data, state.presetTouched]);

  const selectedPreset = presetDetail.data;
  const pinnedModelProviderId =
    selectedPreset && selectedPreset.ownerUserId === currentUser.data?.user?.id
      ? selectedPreset.modelProviderId
      : null;
  const pending = createMutation.isPending || updateMutation.isPending;
  const dirty = chat ? isChatFormDirty(state, chat) : true;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = chat ? validateChatEdit(state) : validateChatForm(state);
    if (!validation.values) {
      setFieldErrors(Object.fromEntries(
        validation.issues.map((issue) => [
          issue.field,
          t(`chats.management.validation.${issue.rule}`),
        ]),
      ));
      return;
    }

    setFieldErrors({});
    try {
      if (chat) {
        const editValidation = validateChatEdit(state);
        if (!editValidation.values) return;
        const updated = await updateMutation.mutateAsync({ id: chat.id, values: editValidation.values });
        onUpdated?.(updated);
      } else {
        const createValidation = validateChatForm(state);
        if (!createValidation.values) return;
        const created = await createMutation.mutateAsync(createValidation.values);
        onCreated(created);
      }
      onOpenChange(false);
    } catch (error) {
      const field = applicationErrorField(error);
      if (field) {
        setFieldErrors({ [field]: t("chats.management.validation.assetUnavailable") });
      } else {
        setFieldErrors({ $: t("chats.management.validation.saveFailed") });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] p-0 sm:max-h-[calc(100dvh-2rem)]">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>
            {t(editing ? "chats.management.form.editTitle" : "chats.management.form.createTitle")}
          </DialogTitle>
          <DialogDescription>{t("chats.management.form.description")}</DialogDescription>
        </DialogHeader>
        <form className="contents" onSubmit={submit}>
          <ScrollArea className="min-h-0 px-4">
            <FieldGroup className="pb-4">
              <Field data-invalid={Boolean(fieldErrors.title)}>
                <FieldLabel htmlFor="chat-title">{t("chats.management.form.title")}</FieldLabel>
                <Input
                  id="chat-title"
                  value={state.title}
                  aria-invalid={Boolean(fieldErrors.title)}
                  maxLength={512}
                  onChange={(event) => setState((current) => editChatTitle(current, event.target.value))}
                />
                <FieldError>{fieldErrors.title}</FieldError>
              </Field>

              <AssetPicker
                kind="character"
                label={t("chats.management.form.character")}
                value={state.chatCharacterId || null}
                required
                error={fieldErrors.chatCharacterId}
                onChange={(id, name) => setState((current) => selectChatCharacter(current, id!, name))}
              />
              <AssetPicker
                kind="character"
                label={t("chats.management.form.persona")}
                value={state.personaCharacterId}
                error={fieldErrors.personaCharacterId}
                onChange={(id) => setState((current) => ({
                  ...current,
                  personaCharacterId: id,
                  personaTouched: true,
                }))}
              />
              <AssetPicker
                kind="preset"
                label={t("chats.management.form.preset")}
                value={state.presetId}
                error={fieldErrors.presetId}
                onChange={(id) => setState((current) => selectPreset(current, id))}
              />
              <AssetPicker
                kind="model"
                label={t("chats.management.form.modelProvider")}
                value={state.modelProviderId}
                error={fieldErrors.modelProviderId}
                pinnedId={pinnedModelProviderId}
                onChange={(id) => setState((current) => selectModelProvider(current, id))}
              />

              {!editing && defaults.isError ? (
                <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                  <span>{t("chats.management.form.defaultsFailed")}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => defaults.refetch()}>
                    <RotateCwIcon data-icon="inline-start" />
                    {t("chats.management.retry")}
                  </Button>
                </div>
              ) : null}
              <FieldError>{fieldErrors.$}</FieldError>
            </FieldGroup>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending || (editing && !dirty)}>
              {pending ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : null}
              {t(editing ? "chats.management.form.save" : "chats.management.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PickerKind = "character" | "preset" | "model";
type PickerItem = { id: string; name: string };

function AssetPicker({
  kind,
  label,
  value,
  required = false,
  error,
  pinnedId,
  onChange,
}: {
  kind: PickerKind;
  label: string;
  value: string | null;
  required?: boolean;
  error?: string | undefined;
  pinnedId?: string | null | undefined;
  onChange: (id: string | null, name: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = usePickerItems(kind, search);
  const items = useMemo(() => {
    const current = query.data ?? [];
    if (!pinnedId) return current;
    return [...current].sort(
      (a, b) => Number(b.id === pinnedId) - Number(a.id === pinnedId),
    );
  }, [pinnedId, query.data]);
  const selected = items.find((item) => item.id === value);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={label}
            aria-invalid={Boolean(error)}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{selected?.name ?? value ?? t("chats.management.form.unselected")}</span>
            <ChevronsUpDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
          <Input
            value={search}
            aria-label={t("chats.management.form.searchAssets")}
            placeholder={t("chats.management.form.searchAssets")}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ScrollArea className="max-h-56">
            <div className="flex flex-col gap-1 py-1">
              {!required ? (
                <PickerButton active={value === null} label={t("chats.management.form.unselected")} onClick={() => {
                  onChange(null, "");
                  setOpen(false);
                }} />
              ) : null}
              {items.map((item) => (
                <PickerButton key={item.id} active={item.id === value} label={item.name} pinned={item.id === pinnedId} onClick={() => {
                  onChange(item.id, item.name);
                  setOpen(false);
                }} />
              ))}
              {query.isLoading ? <span className="px-2 py-3 text-sm text-muted-foreground">{t("chats.management.loading")}</span> : null}
              {query.isError ? <span className="px-2 py-3 text-sm text-destructive">{t("chats.management.loadFailed")}</span> : null}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function PickerButton({ active, label, pinned = false, onClick }: {
  active: boolean;
  label: string;
  pinned?: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button type="button" className={cn(
      "flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-accent",
      active && "bg-accent",
    )} onClick={onClick}>
      <CheckIcon className={cn("shrink-0", !active && "invisible")} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {pinned ? <span className="text-xs text-muted-foreground">{t("chats.management.form.presetModel")}</span> : null}
    </button>
  );
}

function usePickerItems(kind: PickerKind, search: string) {
  return useQuery({
    queryKey: ["chat-form", "assets", kind, search],
    queryFn: async (): Promise<PickerItem[]> => {
      if (kind === "character") {
        return listCharacters({ scope: "all", sort: "name", direction: "asc", pageIndex: 0, pageSize: 100, q: search }).then((page) => page.items);
      }
      if (kind === "preset") {
        return listPresets({ scope: "all", sort: "name", direction: "asc", pageIndex: 0, pageSize: 100, q: search }).then((page) => page.items);
      }
      return listModelProviders({ sort: "name", direction: "asc", pageIndex: 0, pageSize: 100, q: search }).then((page) => page.items);
    },
  });
}

function applicationErrorField(error: unknown): string | null {
  if (!(error instanceof ApiError) || !error.envelope) return null;
  const data = error.envelope.data;
  if (typeof data !== "object" || data === null || !("field" in data)) return null;
  return typeof data.field === "string" ? data.field : null;
}
