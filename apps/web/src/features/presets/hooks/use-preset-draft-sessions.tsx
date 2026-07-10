import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";
import {
  createPreset,
  getPreset,
  updatePresetDocument,
  type PresetDetailResponse,
  type PresetDocument,
} from "../api/presets-api";
import {
  emptyPresetEditorForm,
  presetDocumentEquals,
  presetDocumentFromDetail,
  type PresetEditorFormState,
} from "../model/preset-editor-form";

interface PresetDraftRecord {
  baseline: PresetDocument;
  document: PresetDocument;
  loadedPresetId: string | null;
  errorMessage: string | null;
}

interface PresetDraftSessionsContextValue {
  sessions: Record<string, PresetDraftRecord>;
  setSessionDocument: (
    sessionKey: string,
    update: SetStateAction<PresetDocument>,
  ) => void;
  setSessionError: (sessionKey: string, message: string | null) => void;
  setSessionFromPreset: (
    sessionKey: string,
    preset: PresetDetailResponse,
  ) => void;
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
  saveErrorSessionKey: string | null;
}

export interface PresetDraftSession {
  document: PresetDocument;
  setDocument: Dispatch<SetStateAction<PresetDocument>>;
  form: PresetEditorFormState;
  setForm: Dispatch<SetStateAction<PresetEditorFormState>>;
  isDirty: boolean;
  isPending: boolean;
  visibleError: string | null;
  preset: PresetDetailResponse | undefined;
  saveDocument: (document?: PresetDocument) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const emptyPresetDocument: PresetDocument = {
  name: emptyPresetEditorForm.name,
  modelSettings: emptyPresetEditorForm.modelSettings,
  entries: [],
  promptItems: [],
};

const emptyPresetDraftRecord: PresetDraftRecord = {
  baseline: emptyPresetDocument,
  document: emptyPresetDocument,
  loadedPresetId: null,
  errorMessage: null,
};

const PresetDraftSessionsContext =
  createContext<PresetDraftSessionsContextValue | null>(null);

export function PresetDraftSessionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sessions, setSessions] = useState<Record<string, PresetDraftRecord>>(
    {},
  );
  const queryClient = useQueryClient();

  const setSessionDocument = useCallback(
    (sessionKey: string, update: SetStateAction<PresetDocument>) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyPresetDraftRecord;
        const document =
          typeof update === "function" ? update(current.document) : update;

        return { ...items, [sessionKey]: { ...current, document } };
      });
    },
    [],
  );

  const setSessionError = useCallback(
    (sessionKey: string, message: string | null) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyPresetDraftRecord;
        return {
          ...items,
          [sessionKey]: { ...current, errorMessage: message },
        };
      });
    },
    [],
  );

  const setSessionFromPreset = useCallback(
    (sessionKey: string, preset: PresetDetailResponse) => {
      const document = presetDocumentFromDetail(preset);
      setSessions((items) => ({
        ...items,
        [sessionKey]: {
          baseline: document,
          document,
          loadedPresetId: preset.id,
          errorMessage: null,
        },
      }));
    },
    [],
  );

  const moveSessionToPreset = useCallback(
    (
      fromSessionKey: string,
      toSessionKey: string,
      preset: PresetDetailResponse,
    ) => {
      const document = presetDocumentFromDetail(preset);
      setSessions((items) => {
        const remainingItems = { ...items };
        delete remainingItems[fromSessionKey];

        return {
          ...remainingItems,
          [toSessionKey]: {
            baseline: document,
            document,
            loadedPresetId: preset.id,
            errorMessage: null,
          },
        };
      });
    },
    [],
  );

  const retainSessionKeys = useCallback((sessionKeys: string[]) => {
    setSessions((items) => {
      const retainedKeys = new Set(sessionKeys);
      const entries = Object.entries(items).filter(([key]) =>
        retainedKeys.has(key),
      );

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
      await queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.setQueryData(["preset", preset.id], preset);
      setSessionFromPreset(variables.sessionKey, preset);
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
  const saveErrorSessionKey = saveMutation.isError
    ? (saveMutation.variables?.sessionKey ?? null)
    : null;

  const value = useMemo(
    () => ({
      sessions,
      setSessionDocument,
      setSessionError,
      setSessionFromPreset,
      moveSessionToPreset,
      retainSessionKeys,
      saveSession,
      savingSessionKey,
      saveErrorSessionKey,
    }),
    [
      moveSessionToPreset,
      retainSessionKeys,
      sessions,
      setSessionDocument,
      setSessionError,
      setSessionFromPreset,
      saveSession,
      savingSessionKey,
      saveErrorSessionKey,
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
  onCreated,
  onSaved,
}: {
  sessionKey: string;
  presetId?: string;
  onCreated?: (preset: PresetDetailResponse) => void;
  onSaved?: (preset: PresetDetailResponse) => void;
}): PresetDraftSession {
  const { t } = useTranslation();
  const context = usePresetDraftSessionsContext();
  const {
    sessions,
    setSessionDocument,
    setSessionError,
    setSessionFromPreset,
    saveSession,
    savingSessionKey,
    saveErrorSessionKey,
  } = context;
  const queryClient = useQueryClient();
  const draft = sessions[sessionKey] ?? emptyPresetDraftRecord;
  const presetQuery = useQuery({
    enabled: Boolean(presetId),
    queryKey: ["preset", presetId],
    queryFn: () => getPreset(presetId!),
  });

  useEffect(() => {
    if (presetQuery.data && draft.loadedPresetId !== presetQuery.data.id) {
      setSessionFromPreset(sessionKey, presetQuery.data);
    }
  }, [
    draft.loadedPresetId,
    presetQuery.data,
    sessionKey,
    setSessionFromPreset,
  ]);

  const saveMutation = useMutation({
    mutationFn: (document: PresetDocument) =>
      createPreset({
        name: document.name,
        modelSettings: document.modelSettings,
      }),
    async onSuccess(preset) {
      await queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.setQueryData(["preset", preset.id], preset);
      setSessionFromPreset(sessionKey, preset);
      onCreated?.(preset);
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
      name: draft.document.name,
      modelSettings: draft.document.modelSettings,
    }),
    [draft.document.modelSettings, draft.document.name],
  );
  const setForm = useCallback(
    (update: SetStateAction<PresetEditorFormState>) => {
      setSessionDocument(sessionKey, (current) => {
        const currentForm = {
          name: current.name,
          modelSettings: current.modelSettings,
        };
        const nextForm =
          typeof update === "function" ? update(currentForm) : update;

        return {
          ...current,
          name: nextForm.name,
          modelSettings: nextForm.modelSettings,
        };
      });
    },
    [sessionKey, setSessionDocument],
  );
  const isDirty = !presetDocumentEquals(draft.document, draft.baseline);
  const saveDocument = useCallback(
    (document = draft.document) => {
      setSessionError(sessionKey, null);

      if (!document.name.trim()) {
        setSessionError(sessionKey, t("presets.editor.errors.nameRequired"));
        return;
      }

      setSessionDocument(sessionKey, document);
      const normalizedDocument = { ...document, name: document.name.trim() };

      if (presetId) {
        void saveSession(sessionKey, presetId, normalizedDocument)
          .then((preset) => onSaved?.(preset))
          .catch(() => undefined);
        return;
      }

      saveMutation.mutate(normalizedDocument);
    },
    [
      draft.document,
      onSaved,
      presetId,
      saveMutation,
      saveSession,
      sessionKey,
      setSessionDocument,
      setSessionError,
      t,
    ],
  );
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      saveDocument();
    },
    [saveDocument],
  );

  let visibleError: string | null = null;

  if (draft.errorMessage) {
    visibleError = draft.errorMessage;
  } else if (saveMutation.isError || saveErrorSessionKey === sessionKey) {
    visibleError = t("presets.editor.errors.saveFailed");
  }

  return useMemo(
    () => ({
      document: draft.document,
      setDocument,
      form,
      setForm,
      isDirty,
      isPending:
        saveMutation.isPending ||
        savingSessionKey === sessionKey ||
        presetQuery.isLoading,
      visibleError,
      preset: presetQuery.data,
      saveDocument,
      submit,
    }),
    [
      draft.document,
      form,
      isDirty,
      presetQuery.data,
      presetQuery.isLoading,
      saveDocument,
      saveMutation.isPending,
      savingSessionKey,
      setDocument,
      setForm,
      submit,
      visibleError,
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
    throw new Error("Preset draft hooks must be used inside provider");
  }

  return context;
}
