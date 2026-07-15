import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useTranslation } from 'react-i18next';
import { getFormErrorMessage } from '../../../lib/forms/form-error';
import { notify } from '../../../lib/notifications/notify';
import {
  createPreset,
  getPreset,
  updatePresetDocument,
  type PresetDetailResponse,
  type PresetDocument,
} from '../api/presets-api';
import {
  emptyPresetEditorForm,
  presetDocumentEquals,
  presetDocumentFromDetail,
  type PresetEditorFormState,
} from '../model/preset-editor-form';

interface PresetDraftRecord {
  baseline: PresetDocument;
  document: PresetDocument;
}

interface PresetDraftSessionsContextValue {
  sessions: Record<string, PresetDraftRecord>;
  setSessionDocument: (sessionKey: string, update: SetStateAction<PresetDocument>) => void;
  setSessionFromPreset: (sessionKey: string, preset: PresetDetailResponse) => void;
  moveSessionToPreset: (
    fromSessionKey: string,
    toSessionKey: string,
    preset: PresetDetailResponse,
  ) => void;
  retainSessionKeys: (sessionKeys: string[]) => void;
  saveSession: (
    sessionKey: string,
    presetId: string,
    document: PresetDocument,
  ) => Promise<PresetDetailResponse>;
  savingSessionKey: string | null;
}

export interface PresetDraftSession {
  document: PresetDocument;
  setDocument: Dispatch<SetStateAction<PresetDocument>>;
  form: PresetEditorFormState;
  setForm: Dispatch<SetStateAction<PresetEditorFormState>>;
  isDirty: boolean;
  isPending: boolean;
  loadError: unknown;
  preset: PresetDetailResponse | undefined;
  saveDocument: (
    document?: PresetDocument,
    onSaved?: (preset: PresetDetailResponse) => void,
  ) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const emptyPresetDocument: PresetDocument = {
  name: emptyPresetEditorForm.name,
  visibility: emptyPresetEditorForm.visibility,
  modelProviderId: emptyPresetEditorForm.modelProviderId,
  modelSettings: emptyPresetEditorForm.modelSettings,
  entries: [],
  promptItems: [],
};

const emptyPresetDraftRecord: PresetDraftRecord = {
  baseline: emptyPresetDocument,
  document: emptyPresetDocument,
};

const PresetDraftSessionsContext = createContext<PresetDraftSessionsContextValue | null>(null);

export function PresetDraftSessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, PresetDraftRecord>>({});
  const queryClient = useQueryClient();

  const setSessionDocument = useCallback(
    (sessionKey: string, update: SetStateAction<PresetDocument>) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyPresetDraftRecord;
        const document = typeof update === 'function' ? update(current.document) : update;

        return { ...items, [sessionKey]: { ...current, document } };
      });
    },
    [],
  );

  const setSessionFromPreset = useCallback((sessionKey: string, preset: PresetDetailResponse) => {
    const document = presetDocumentFromDetail(preset);
    setSessions((items) => ({
      ...items,
      [sessionKey]: {
        baseline: document,
        document,
      },
    }));
  }, []);

  const moveSessionToPreset = useCallback(
    (fromSessionKey: string, toSessionKey: string, preset: PresetDetailResponse) => {
      const document = presetDocumentFromDetail(preset);
      setSessions((items) => {
        const remainingItems = { ...items };
        delete remainingItems[fromSessionKey];

        return {
          ...remainingItems,
          [toSessionKey]: {
            baseline: document,
            document,
          },
        };
      });
    },
    [],
  );

  const retainSessionKeys = useCallback((sessionKeys: string[]) => {
    setSessions((items) => {
      const retainedKeys = new Set(sessionKeys);
      const entries = Object.entries(items).filter(([key]) => retainedKeys.has(key));

      if (entries.length === Object.keys(items).length) {
        return items;
      }

      return Object.fromEntries(entries);
    });
  }, []);
  const saveMutation = useMutation({
    mutationFn: ({
      presetId,
      document,
    }: {
      sessionKey: string;
      presetId: string;
      document: PresetDocument;
    }) => updatePresetDocument(presetId, document),
    async onSuccess(preset, variables) {
      await queryClient.invalidateQueries({ queryKey: ['presets'] });
      queryClient.setQueryData(['preset', preset.id], preset);
      setSessionFromPreset(variables.sessionKey, preset);
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });
  const saveSession = useCallback(
    (sessionKey: string, presetId: string, document: PresetDocument) => {
      return saveMutation.mutateAsync({ sessionKey, presetId, document });
    },
    [saveMutation],
  );
  const savingSessionKey = saveMutation.isPending
    ? (saveMutation.variables?.sessionKey ?? null)
    : null;

  const value = useMemo(
    () => ({
      sessions,
      setSessionDocument,
      setSessionFromPreset,
      moveSessionToPreset,
      retainSessionKeys,
      saveSession,
      savingSessionKey,
    }),
    [
      moveSessionToPreset,
      retainSessionKeys,
      sessions,
      setSessionDocument,
      setSessionFromPreset,
      saveSession,
      savingSessionKey,
    ],
  );

  return (
    <PresetDraftSessionsContext.Provider value={value}>
      {children}
    </PresetDraftSessionsContext.Provider>
  );
}

export function usePresetDraftSession({
  sessionKey,
  presetId,
  hydrateFromQueryOnMount = false,
  onCreated,
}: {
  sessionKey: string;
  presetId?: string;
  hydrateFromQueryOnMount?: boolean;
  onCreated?: (preset: PresetDetailResponse) => void;
}): PresetDraftSession {
  const { t } = useTranslation();
  const context = usePresetDraftSessionsContext();
  const { sessions, setSessionDocument, setSessionFromPreset, saveSession, savingSessionKey } =
    context;
  const queryClient = useQueryClient();
  const draft = sessions[sessionKey] ?? emptyPresetDraftRecord;
  const hydratedPresetId = useRef<string | null>(null);
  const presetQuery = useQuery({
    enabled: Boolean(presetId),
    queryKey: ['preset', presetId],
    queryFn: () => getPreset(presetId!),
  });
  const queriedDocument =
    hydrateFromQueryOnMount && presetQuery.data && hydratedPresetId.current !== presetQuery.data.id
      ? presetDocumentFromDetail(presetQuery.data)
      : null;
  const document = queriedDocument ?? draft.document;
  const baseline = queriedDocument ?? draft.baseline;

  useEffect(() => {
    if (
      hydrateFromQueryOnMount &&
      presetQuery.data &&
      hydratedPresetId.current !== presetQuery.data.id
    ) {
      setSessionFromPreset(sessionKey, presetQuery.data);
      hydratedPresetId.current = presetQuery.data.id;
    }
  }, [presetQuery.data, hydrateFromQueryOnMount, sessionKey, setSessionFromPreset]);

  const saveMutation = useMutation({
    mutationFn: (document: PresetDocument) =>
      createPreset({
        name: document.name,
        visibility: document.visibility,
        modelProviderId: document.modelProviderId,
        modelSettings: document.modelSettings,
      }),
    async onSuccess(preset) {
      await queryClient.invalidateQueries({ queryKey: ['presets'] });
      queryClient.setQueryData(['preset', preset.id], preset);
      setSessionFromPreset(sessionKey, preset);
      onCreated?.(preset);
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });

  const setDocument = useCallback(
    (update: SetStateAction<PresetDocument>) => {
      setSessionDocument(sessionKey, update);
    },
    [sessionKey, setSessionDocument],
  );
  const form = useMemo<PresetEditorFormState>(
    () => ({
      name: document.name,
      visibility: document.visibility,
      modelProviderId: document.modelProviderId,
      modelSettings: document.modelSettings,
    }),
    [document.modelProviderId, document.modelSettings, document.name, document.visibility],
  );
  const setForm = useCallback(
    (update: SetStateAction<PresetEditorFormState>) => {
      setSessionDocument(sessionKey, (current) => {
        const currentForm = {
          name: current.name,
          visibility: current.visibility,
          modelProviderId: current.modelProviderId,
          modelSettings: current.modelSettings,
        };
        const nextForm = typeof update === 'function' ? update(currentForm) : update;

        return {
          ...current,
          name: nextForm.name,
          visibility: nextForm.visibility,
          modelProviderId: nextForm.modelProviderId,
          modelSettings: nextForm.modelSettings,
        };
      });
    },
    [sessionKey, setSessionDocument],
  );
  const isDirty = !presetDocumentEquals(document, baseline);
  const saveDocument = useCallback(
    (documentToSave = document, onSaved?: (preset: PresetDetailResponse) => void) => {
      if (!documentToSave.name.trim()) {
        notify.error({ title: t('presets.editor.errors.nameRequired') });
        return;
      }

      setSessionDocument(sessionKey, documentToSave);
      const normalizedDocument = {
        ...documentToSave,
        name: documentToSave.name.trim(),
      };

      if (presetId) {
        void saveSession(sessionKey, presetId, normalizedDocument)
          .then((preset) => onSaved?.(preset))
          .catch(() => undefined);
        return;
      }

      saveMutation.mutate(normalizedDocument);
    },
    [document, presetId, saveMutation, saveSession, sessionKey, setSessionDocument, t],
  );
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      saveDocument();
    },
    [saveDocument],
  );

  return useMemo(
    () => ({
      document,
      setDocument,
      form,
      setForm,
      isDirty,
      isPending: saveMutation.isPending || savingSessionKey === sessionKey || presetQuery.isLoading,
      loadError: presetQuery.isError ? presetQuery.error : null,
      preset: presetQuery.data,
      saveDocument,
      submit,
    }),
    [
      document,
      form,
      isDirty,
      presetQuery.data,
      presetQuery.error,
      presetQuery.isError,
      presetQuery.isLoading,
      saveDocument,
      saveMutation.isPending,
      savingSessionKey,
      setDocument,
      setForm,
      submit,
    ],
  );
}

export function useRetainPresetDraftSessions(sessionKeys: string[]) {
  const { retainSessionKeys } = usePresetDraftSessionsContext();

  useEffect(() => {
    retainSessionKeys(sessionKeys);
  }, [retainSessionKeys, sessionKeys]);
}

export function usePresetDraftSessionActions() {
  const { moveSessionToPreset } = usePresetDraftSessionsContext();

  return useMemo(() => ({ moveSessionToPreset }), [moveSessionToPreset]);
}

function usePresetDraftSessionsContext(): PresetDraftSessionsContextValue {
  const context = useContext(PresetDraftSessionsContext);

  if (!context) {
    throw new Error('Preset draft hooks must be used inside provider');
  }

  return context;
}
