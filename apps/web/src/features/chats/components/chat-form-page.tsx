import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CableIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  RotateCwIcon,
  SlidersHorizontalIcon,
  UserRoundIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../../../components/ui/empty';
import { Field, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { ApiError } from '../../../lib/api/client';
import { notify } from '../../../lib/notifications/notify';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { useCurrentUser } from '../../auth/hooks/use-current-user';
import { getCharacter } from '../../characters/api/characters-api';
import { useAssetDefaults } from '../../chat-preferences/hooks/use-asset-defaults';
import { getModelProvider } from '../../model-providers/api/model-providers-api';
import { getPreset } from '../../presets/api/presets-api';
import type { ChatDetail } from '../api/chats-api';
import { chatKeys, useChat, useCreateChat, useUpdateChat } from '../hooks/use-chats';
import {
  applyAssetDefaults,
  applyOwnedPresetModel,
  editChatForm,
  editChatTitle,
  emptyCreateChatForm,
  isChatFormDirty,
  isCreateChatFormDirty,
  selectChatCharacter,
  selectModelProvider,
  selectPreset,
  validateChatEdit,
  validateChatForm,
  type ChatFormState,
} from '../model/chat-form';
import type {
  CharacterAssetSelection,
  ModelProviderAssetSelection,
  PresetAssetSelection,
} from './chat-asset-selections';
import { CharacterSelectionDialog } from './character-selection-dialog';
import { ModelProviderSelectionDialog } from './model-provider-selection-dialog';
import { formatModelProviderKind } from './model-provider-kind-label';
import { PresetSelectionDialog } from './preset-selection-dialog';

type PickerKind = 'character' | 'persona' | 'preset' | 'modelProvider';

interface ChatFormSelections {
  character: CharacterAssetSelection | null;
  persona: CharacterAssetSelection | null;
  preset: PresetAssetSelection | null;
  modelProvider: ModelProviderAssetSelection | null;
}

export function ChatCreatePage({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (chat: ChatDetail) => void;
}) {
  return <ChatFormEditor chat={null} onBack={onBack} onSaved={onCreated} />;
}

export function ChatEditPage({
  chatId,
  onBack,
  onNotFound,
  onUpdated,
}: {
  chatId: string;
  onBack: () => void;
  onNotFound: () => void;
  onUpdated: (chat: ChatDetail) => void;
}) {
  const { t } = useTranslation();
  const query = useChat(chatId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.rawResponse?.status === 404) {
      notify.error({ title: t('chats.management.editUnavailable') });
      void queryClient.invalidateQueries({ queryKey: chatKeys.lists });
      onNotFound();
    }
  }, [onNotFound, query.error, queryClient, t]);

  if (query.isError) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-background">
        <MobileTopBar title={t('chats.management.form.editTitle')} onBack={onBack} />
        <Empty className="min-h-0 flex-1">
          <EmptyHeader>
            <EmptyTitle>{t('chats.management.loadFailed')}</EmptyTitle>
            <EmptyDescription>
              {t('chats.management.current.loadFailedDescription')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" variant="outline" onClick={() => void query.refetch()}>
              <RotateCwIcon data-icon="inline-start" />
              {t('chats.management.retry')}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-background">
        <MobileTopBar title={t('chats.management.form.editTitle')} onBack={onBack} />
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircleIcon className="animate-spin" />
          {t('chats.management.loading')}
        </div>
      </div>
    );
  }

  return <ChatFormEditor chat={query.data} onBack={onBack} onSaved={onUpdated} />;
}

function ChatFormEditor({
  chat,
  onBack,
  onSaved,
}: {
  chat: ChatDetail | null;
  onBack: () => void;
  onSaved: (chat: ChatDetail) => void;
}) {
  const { t } = useTranslation();
  const editing = chat !== null;
  const [state, setState] = useState<ChatFormState>(() =>
    chat ? editChatForm(chat) : emptyCreateChatForm(),
  );
  const [selections, setSelections] = useState<ChatFormSelections>(() => ({
    character: chat?.chatCharacter ?? null,
    persona: chat?.persona ?? null,
    preset: chat?.preset ?? null,
    modelProvider: chat?.modelProvider ?? null,
  }));
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const defaults = useAssetDefaults();
  const currentUser = useCurrentUser();
  const createMutation = useCreateChat();
  const updateMutation = useUpdateChat();

  useEffect(() => {
    if (editing || !defaults.data) return;
    setState((current) => applyAssetDefaults(current, defaults.data));
  }, [defaults.data, editing]);

  const characterQuery = useQuery({
    enabled: state.chatCharacterId.length > 0 && selections.character?.id !== state.chatCharacterId,
    queryKey: ['character', state.chatCharacterId],
    queryFn: () => getCharacter(state.chatCharacterId),
  });
  const personaQuery = useQuery({
    enabled:
      state.personaCharacterId !== null && selections.persona?.id !== state.personaCharacterId,
    queryKey: ['character', state.personaCharacterId ?? ''],
    queryFn: () => getCharacter(state.personaCharacterId!),
  });
  const presetQuery = useQuery({
    enabled: state.presetId !== null,
    queryKey: ['preset', state.presetId ?? ''],
    queryFn: () => getPreset(state.presetId!),
  });
  const modelProviderQuery = useQuery({
    enabled:
      state.modelProviderId !== null && selections.modelProvider?.id !== state.modelProviderId,
    queryKey: ['model-provider', state.modelProviderId ?? ''],
    queryFn: () => getModelProvider(state.modelProviderId!),
  });

  useEffect(() => {
    const preset = presetQuery.data;
    const userId = currentUser.data?.user?.id;
    if (!preset || !userId || preset.ownerUserId !== userId) return;
    setState((current) => applyOwnedPresetModel(current, preset.modelProviderId));
  }, [currentUser.data?.user?.id, presetQuery.data]);

  const character =
    selections.character?.id === state.chatCharacterId
      ? selections.character
      : characterQuery.data?.id === state.chatCharacterId
        ? characterQuery.data
        : null;
  const persona =
    selections.persona?.id === state.personaCharacterId
      ? selections.persona
      : personaQuery.data?.id === state.personaCharacterId
        ? personaQuery.data
        : null;
  const preset =
    selections.preset?.id === state.presetId
      ? selections.preset
      : presetQuery.data?.id === state.presetId
        ? presetQuery.data
        : null;
  const modelProvider =
    selections.modelProvider?.id === state.modelProviderId
      ? selections.modelProvider
      : modelProviderQuery.data?.id === state.modelProviderId
        ? modelProviderQuery.data
        : null;
  const presetDetail = presetQuery.data;
  const pinnedModelProviderId =
    presetDetail && presetDetail.ownerUserId === currentUser.data?.user?.id
      ? presetDetail.modelProviderId
      : null;
  const pending = createMutation.isPending || updateMutation.isPending;
  const dirty = chat ? isChatFormDirty(state, chat) : isCreateChatFormDirty(state);

  function requestBack() {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onBack();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      let saved: ChatDetail;
      if (chat) {
        const validation = validateChatEdit(state);
        if (!validation.values) {
          setValidationErrors(validation.issues);
          return;
        }
        setFieldErrors({});
        saved = await updateMutation.mutateAsync({ id: chat.id, values: validation.values });
      } else {
        const validation = validateChatForm(state);
        if (!validation.values) {
          setValidationErrors(validation.issues);
          return;
        }
        setFieldErrors({});
        saved = await createMutation.mutateAsync(validation.values);
      }
      onSaved(saved);
    } catch (error) {
      const field = applicationErrorField(error);
      setFieldErrors(
        field
          ? { [field]: t('chats.management.validation.assetUnavailable') }
          : { $: t('chats.management.validation.saveFailed') },
      );
    }
  }

  function setValidationErrors(issues: Array<{ field: string; rule: string }>) {
    setFieldErrors(
      Object.fromEntries(
        issues.map((issue) => [issue.field, t(`chats.management.validation.${issue.rule}`)]),
      ),
    );
  }

  return (
    <main className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <MobileTopBar
        title={t(editing ? 'chats.management.form.editTitle' : 'chats.management.form.createTitle')}
        onBack={requestBack}
      />
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void submit(event)}>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <FieldGroup className="mx-auto w-full max-w-2xl gap-5">
            <Field data-invalid={Boolean(fieldErrors.title)}>
              <FieldLabel htmlFor="chat-title">{t('chats.management.form.title')}</FieldLabel>
              <Input
                id="chat-title"
                aria-invalid={Boolean(fieldErrors.title)}
                maxLength={512}
                value={state.title}
                onChange={(event) =>
                  setState((current) => editChatTitle(current, event.target.value))
                }
              />
              <FieldError>{fieldErrors.title}</FieldError>
            </Field>

            <AssetPickerField
              avatar={character}
              error={fieldErrors.chatCharacterId}
              icon={UserRoundIcon}
              label={t('chats.management.form.character')}
              loading={state.chatCharacterId.length > 0 && characterQuery.isLoading}
              unavailable={state.chatCharacterId.length > 0 && characterQuery.isError}
              value={character?.name}
              onClick={() => setPicker('character')}
            />
            <AssetPickerField
              avatar={persona}
              error={fieldErrors.personaCharacterId}
              icon={UserRoundIcon}
              label={t('chats.management.form.persona')}
              loading={state.personaCharacterId !== null && personaQuery.isLoading}
              unavailable={state.personaCharacterId !== null && personaQuery.isError}
              value={persona?.name}
              onClick={() => setPicker('persona')}
            />
            <AssetPickerField
              detail={
                preset?.entryCount === undefined
                  ? undefined
                  : t('chats.management.form.presetSummary', {
                      entries: preset.entryCount,
                      tokens: preset.tokenCount?.toLocaleString() ?? 0,
                    })
              }
              error={fieldErrors.presetId}
              icon={SlidersHorizontalIcon}
              label={t('chats.management.form.preset')}
              loading={state.presetId !== null && presetQuery.isLoading}
              unavailable={state.presetId !== null && presetQuery.isError}
              value={preset?.name}
              onClick={() => setPicker('preset')}
            />
            <AssetPickerField
              detail={
                modelProvider
                  ? [
                      formatModelProviderKind(modelProvider.providerKind),
                      modelProvider.defaultModelName,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : undefined
              }
              error={fieldErrors.modelProviderId}
              icon={CableIcon}
              label={t('chats.management.form.modelProvider')}
              loading={state.modelProviderId !== null && modelProviderQuery.isLoading}
              unavailable={state.modelProviderId !== null && modelProviderQuery.isError}
              value={modelProvider?.name}
              onClick={() => setPicker('modelProvider')}
            />

            {!editing && defaults.isError ? (
              <Alert>
                <AlertDescription>{t('chats.management.form.defaultsFailed')}</AlertDescription>
                <AlertAction>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void defaults.refetch()}
                  >
                    <RotateCwIcon data-icon="inline-start" />
                    {t('chats.management.retry')}
                  </Button>
                </AlertAction>
              </Alert>
            ) : null}
            <FieldError>{fieldErrors.$}</FieldError>
          </FieldGroup>
        </div>

        <div className="shrink-0 border-t bg-background px-4 py-3">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              className="w-full"
              disabled={pending || (editing && !dirty)}
              type="submit"
              size="lg"
            >
              {pending ? (
                <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
              ) : null}
              {t(editing ? 'chats.management.form.save' : 'chats.management.form.create')}
            </Button>
          </div>
        </div>
      </form>

      <CharacterSelectionDialog
        defaultPersonaId={defaults.data?.personaCharacterId ?? null}
        open={picker === 'character'}
        purpose="character"
        selectedId={state.chatCharacterId || null}
        value={character}
        onConfirm={(value) => {
          if (!value) return;
          setSelections((current) => ({ ...current, character: value }));
          setState((current) => selectChatCharacter(current, value.id, value.name));
        }}
        onOpenChange={(open) => setPicker(open ? 'character' : null)}
      />
      <CharacterSelectionDialog
        defaultPersonaId={defaults.data?.personaCharacterId ?? null}
        open={picker === 'persona'}
        purpose="persona"
        selectedId={state.personaCharacterId}
        value={persona}
        onConfirm={(value) => {
          setSelections((current) => ({ ...current, persona: value }));
          setState((current) => ({
            ...current,
            personaCharacterId: value?.id ?? null,
            personaTouched: true,
          }));
        }}
        onOpenChange={(open) => setPicker(open ? 'persona' : null)}
      />
      <PresetSelectionDialog
        defaultPresetId={defaults.data?.presetId ?? null}
        open={picker === 'preset'}
        selectedId={state.presetId}
        value={preset}
        onConfirm={(value) => {
          setSelections((current) => ({ ...current, preset: value }));
          setState((current) => selectPreset(current, value?.id ?? null));
        }}
        onOpenChange={(open) => setPicker(open ? 'preset' : null)}
      />
      <ModelProviderSelectionDialog
        defaultModelProviderId={defaults.data?.modelProviderId ?? null}
        open={picker === 'modelProvider'}
        pinnedModelProviderId={pinnedModelProviderId}
        selectedId={state.modelProviderId}
        value={modelProvider}
        onConfirm={(value) => {
          setSelections((current) => ({ ...current, modelProvider: value }));
          setState((current) => selectModelProvider(current, value?.id ?? null));
        }}
        onOpenChange={(open) => setPicker(open ? 'modelProvider' : null)}
      />

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chats.management.discard.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('chats.management.discard.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onBack}>
              {t('chats.management.discard.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function AssetPickerField({
  label,
  value,
  detail,
  error,
  avatar,
  icon: Icon,
  loading,
  unavailable,
  onClick,
}: {
  label: string;
  value?: string | undefined;
  detail?: string | undefined;
  error?: string | undefined;
  avatar?: CharacterAssetSelection | null | undefined;
  icon: LucideIcon;
  loading: boolean;
  unavailable: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const avatarSource = avatar?.avatar?.sources['64'] ?? avatar?.avatar?.sources['128'];
  const visibleValue = loading
    ? t('chats.management.form.assetLoading')
    : unavailable
      ? t('chats.management.form.assetUnavailable')
      : (value ?? t('chats.management.form.unselected'));

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel>{label}</FieldLabel>
      <Button
        aria-invalid={Boolean(error)}
        className="h-auto min-h-14 w-full justify-start px-3 py-2 text-left whitespace-normal"
        type="button"
        variant="outline"
        onClick={onClick}
      >
        {avatar ? (
          <Avatar size="lg">
            {avatarSource ? <AvatarImage alt={avatar.name} src={avatarSource} /> : null}
            <AvatarFallback>{avatar.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{visibleValue}</span>
          {detail ? <span className="truncate text-xs text-muted-foreground">{detail}</span> : null}
        </span>
        <ChevronRightIcon className="shrink-0 text-muted-foreground" />
      </Button>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function applicationErrorField(error: unknown): string | null {
  if (!(error instanceof ApiError) || !error.envelope) return null;
  const data = error.envelope.data;
  if (typeof data !== 'object' || data === null || !('field' in data)) return null;
  return typeof data.field === 'string' ? data.field : null;
}
