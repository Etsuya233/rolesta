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
  updatePreset,
  type PresetDetailResponse,
} from "../api/presets-api";
import {
  emptyPresetEditorForm,
  presetEditorFormFromDetail,
  presetValuesFromForm,
  type PresetEditorFormState,
} from "../model/preset-editor-form";

interface PresetDraftRecord {
  form: PresetEditorFormState;
  loadedPresetId: string | null;
  errorMessage: string | null;
}

interface PresetDraftSessionsContextValue {
  sessions: Record<string, PresetDraftRecord>;
  setSessionForm: (
    sessionKey: string,
    update: SetStateAction<PresetEditorFormState>,
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
}

export interface PresetDraftSession {
  form: PresetEditorFormState;
  setForm: Dispatch<SetStateAction<PresetEditorFormState>>;
  isPending: boolean;
  visibleError: string | null;
  preset: PresetDetailResponse | undefined;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const emptyPresetDraftRecord: PresetDraftRecord = {
  form: emptyPresetEditorForm,
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

  const setSessionForm = useCallback(
    (sessionKey: string, update: SetStateAction<PresetEditorFormState>) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyPresetDraftRecord;
        const form =
          typeof update === "function" ? update(current.form) : update;

        return { ...items, [sessionKey]: { ...current, form } };
      });
    },
    [],
  );

  const setSessionError = useCallback(
    (sessionKey: string, message: string | null) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyPresetDraftRecord;
        return { ...items, [sessionKey]: { ...current, errorMessage: message } };
      });
    },
    [],
  );

  const setSessionFromPreset = useCallback(
    (sessionKey: string, preset: PresetDetailResponse) => {
      setSessions((items) => ({
        ...items,
        [sessionKey]: {
          form: presetEditorFormFromDetail(preset),
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
      setSessions((items) => {
        const remainingItems = { ...items };
        delete remainingItems[fromSessionKey];

        return {
          ...remainingItems,
          [toSessionKey]: {
            form: presetEditorFormFromDetail(preset),
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
      return Object.fromEntries(
        Object.entries(items).filter(([key]) => retainedKeys.has(key)),
      );
    });
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      setSessionForm,
      setSessionError,
      setSessionFromPreset,
      moveSessionToPreset,
      retainSessionKeys,
    }),
    [
      moveSessionToPreset,
      retainSessionKeys,
      sessions,
      setSessionError,
      setSessionForm,
      setSessionFromPreset,
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
}: {
  sessionKey: string;
  presetId?: string;
  onCreated?: (preset: PresetDetailResponse) => void;
}): PresetDraftSession {
  const { t } = useTranslation();
  const context = useContext(PresetDraftSessionsContext);

  if (!context) {
    throw new Error("usePresetDraftSession must be used inside provider");
  }

  const { sessions, setSessionError, setSessionForm, setSessionFromPreset } =
    context;
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
    mutationFn: (values: ReturnType<typeof presetValuesFromForm>) =>
      presetId ? updatePreset(presetId, values) : createPreset(values),
    async onSuccess(preset) {
      await queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.setQueryData(["preset", preset.id], preset);
      onCreated?.(preset);
    },
  });

  const setForm = useCallback(
    (update: SetStateAction<PresetEditorFormState>) => {
      setSessionForm(sessionKey, update);
    },
    [sessionKey, setSessionForm],
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSessionError(sessionKey, null);

      if (!draft.form.name.trim()) {
        setSessionError(sessionKey, t("presets.editor.errors.nameRequired"));
        return;
      }

      saveMutation.mutate(presetValuesFromForm(draft.form));
    },
    [draft.form, saveMutation, sessionKey, setSessionError, t],
  );

  let visibleError: string | null = null;

  if (draft.errorMessage) {
    visibleError = draft.errorMessage;
  } else if (saveMutation.isError) {
    visibleError = t("presets.editor.errors.saveFailed");
  }

  return useMemo(
    () => ({
      form: draft.form,
      setForm,
      isPending: saveMutation.isPending || presetQuery.isLoading,
      visibleError,
      preset: presetQuery.data,
      submit,
    }),
    [
      draft.form,
      presetQuery.data,
      presetQuery.isLoading,
      saveMutation.isPending,
      setForm,
      submit,
      visibleError,
    ],
  );
}

export function useRetainPresetDraftSessions(sessionKeys: string[]) {
  const context = useContext(PresetDraftSessionsContext);

  if (!context) {
    throw new Error("useRetainPresetDraftSessions must be used inside provider");
  }

  const { retainSessionKeys } = context;

  useEffect(() => {
    retainSessionKeys(sessionKeys);
  }, [retainSessionKeys, sessionKeys]);
}

export function usePresetDraftSessionActions() {
  const context = useContext(PresetDraftSessionsContext);

  if (!context) {
    throw new Error("usePresetDraftSessionActions must be used inside provider");
  }

  return useMemo(
    () => ({ moveSessionToPreset: context.moveSessionToPreset }),
    [context.moveSessionToPreset],
  );
}
