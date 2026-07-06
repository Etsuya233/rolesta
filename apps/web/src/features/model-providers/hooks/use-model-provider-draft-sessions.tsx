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
  createModelProvider,
  getModelProvider,
  updateModelProvider,
  type ModelProviderDetailResponse,
} from "../api/model-providers-api";
import {
  emptyModelProviderEditorForm,
  modelProviderCreateValuesFromForm,
  modelProviderEditorFormFromDetail,
  modelProviderSaveValuesFromForm,
  type ModelProviderEditorFormState,
} from "../model/model-provider-editor-form";

interface ModelProviderDraftRecord {
  form: ModelProviderEditorFormState;
  loadedConfigId: string | null;
  errorMessage: string | null;
}

interface ModelProviderDraftSessionsContextValue {
  sessions: Record<string, ModelProviderDraftRecord>;
  setSessionForm: (
    sessionKey: string,
    update: SetStateAction<ModelProviderEditorFormState>,
  ) => void;
  setSessionError: (sessionKey: string, message: string | null) => void;
  setSessionFromConfig: (
    sessionKey: string,
    config: ModelProviderDetailResponse,
  ) => void;
  moveSessionToConfig: (
    fromSessionKey: string,
    toSessionKey: string,
    config: ModelProviderDetailResponse,
  ) => void;
  retainSessionKeys: (sessionKeys: string[]) => void;
}

export interface ModelProviderDraftSession {
  form: ModelProviderEditorFormState;
  setForm: Dispatch<SetStateAction<ModelProviderEditorFormState>>;
  isPending: boolean;
  visibleError: string | null;
  config: ModelProviderDetailResponse | undefined;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const emptyDraftRecord: ModelProviderDraftRecord = {
  form: emptyModelProviderEditorForm,
  loadedConfigId: null,
  errorMessage: null,
};

const ModelProviderDraftSessionsContext =
  createContext<ModelProviderDraftSessionsContextValue | null>(null);

export function ModelProviderDraftSessionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sessions, setSessions] = useState<Record<string, ModelProviderDraftRecord>>(
    {},
  );

  const setSessionForm = useCallback(
    (
      sessionKey: string,
      update: SetStateAction<ModelProviderEditorFormState>,
    ) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyDraftRecord;
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
        const current = items[sessionKey] ?? emptyDraftRecord;
        return { ...items, [sessionKey]: { ...current, errorMessage: message } };
      });
    },
    [],
  );

  const setSessionFromConfig = useCallback(
    (sessionKey: string, config: ModelProviderDetailResponse) => {
      setSessions((items) => ({
        ...items,
        [sessionKey]: {
          form: modelProviderEditorFormFromDetail(config),
          loadedConfigId: config.id,
          errorMessage: null,
        },
      }));
    },
    [],
  );

  const moveSessionToConfig = useCallback(
    (
      fromSessionKey: string,
      toSessionKey: string,
      config: ModelProviderDetailResponse,
    ) => {
      setSessions((items) => {
        const remainingItems = { ...items };
        delete remainingItems[fromSessionKey];

        return {
          ...remainingItems,
          [toSessionKey]: {
            form: modelProviderEditorFormFromDetail(config),
            loadedConfigId: config.id,
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
      setSessionFromConfig,
      moveSessionToConfig,
      retainSessionKeys,
    }),
    [
      moveSessionToConfig,
      retainSessionKeys,
      sessions,
      setSessionError,
      setSessionForm,
      setSessionFromConfig,
    ],
  );

  return (
    <ModelProviderDraftSessionsContext.Provider value={value}>
      {children}
    </ModelProviderDraftSessionsContext.Provider>
  );
}

export function useModelProviderDraftSession({
  sessionKey,
  configId,
  onCreated,
}: {
  sessionKey: string;
  configId?: string;
  onCreated?: (config: ModelProviderDetailResponse) => void;
}): ModelProviderDraftSession {
  const { t } = useTranslation();
  const context = useContext(ModelProviderDraftSessionsContext);

  if (!context) {
    throw new Error("useModelProviderDraftSession must be used inside provider");
  }

  const { sessions, setSessionError, setSessionForm, setSessionFromConfig } =
    context;
  const queryClient = useQueryClient();
  const draft = sessions[sessionKey] ?? emptyDraftRecord;
  const configQuery = useQuery({
    enabled: Boolean(configId),
    queryKey: ["model-provider", configId],
    queryFn: () => getModelProvider(configId!),
  });

  useEffect(() => {
    if (configQuery.data && draft.loadedConfigId !== configQuery.data.id) {
      setSessionFromConfig(sessionKey, configQuery.data);
    }
  }, [
    configQuery.data,
    draft.loadedConfigId,
    sessionKey,
    setSessionFromConfig,
  ]);

  const saveMutation = useMutation({
    mutationFn: (values: ReturnType<typeof modelProviderSaveValuesFromForm>) =>
      configId
        ? updateModelProvider(configId, values)
        : createModelProvider(modelProviderCreateValuesFromForm(draft.form)),
    async onSuccess(config) {
      await queryClient.invalidateQueries({ queryKey: ["model-providers"] });
      queryClient.setQueryData(["model-provider", config.id], config);
      onCreated?.(config);
    },
  });

  const setForm = useCallback(
    (update: SetStateAction<ModelProviderEditorFormState>) => {
      setSessionForm(sessionKey, update);
    },
    [sessionKey, setSessionForm],
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSessionError(sessionKey, null);

      if (!draft.form.name.trim()) {
        setSessionError(sessionKey, t("modelProviders.editor.errors.nameRequired"));
        return;
      }

      if (!draft.form.baseUrl.trim()) {
        setSessionError(sessionKey, t("modelProviders.editor.errors.baseUrlRequired"));
        return;
      }

      saveMutation.mutate(modelProviderSaveValuesFromForm(draft.form));
    },
    [draft.form, saveMutation, sessionKey, setSessionError, t],
  );

  let visibleError: string | null = null;

  if (draft.errorMessage) {
    visibleError = draft.errorMessage;
  } else if (saveMutation.isError) {
    visibleError = t("modelProviders.editor.errors.saveFailed");
  }

  return useMemo(
    () => ({
      form: draft.form,
      setForm,
      isPending: saveMutation.isPending || configQuery.isLoading,
      visibleError,
      config: configQuery.data,
      submit,
    }),
    [
      configQuery.data,
      configQuery.isLoading,
      draft.form,
      saveMutation.isPending,
      setForm,
      submit,
      visibleError,
    ],
  );
}

export function useRetainModelProviderDraftSessions(sessionKeys: string[]) {
  const context = useContext(ModelProviderDraftSessionsContext);

  if (!context) {
    throw new Error("useRetainModelProviderDraftSessions must be used inside provider");
  }

  const { retainSessionKeys } = context;

  useEffect(() => {
    retainSessionKeys(sessionKeys);
  }, [retainSessionKeys, sessionKeys]);
}

export function useModelProviderDraftSessionActions() {
  const context = useContext(ModelProviderDraftSessionsContext);

  if (!context) {
    throw new Error("useModelProviderDraftSessionActions must be used inside provider");
  }

  return useMemo(
    () => ({ moveSessionToConfig: context.moveSessionToConfig }),
    [context.moveSessionToConfig],
  );
}
