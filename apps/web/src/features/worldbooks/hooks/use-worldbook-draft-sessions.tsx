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
  createWorldbook,
  getWorldbook,
  updateWorldbook,
  type WorldbookDetailResponse,
} from "../api/worldbooks-api";
import {
  emptyWorldbookEditorForm,
  worldbookEditorFormFromDetail,
  worldbookValuesFromForm,
  type WorldbookEditorFormState,
} from "../model/worldbook-editor-form";

interface WorldbookDraftRecord {
  form: WorldbookEditorFormState;
  loadedWorldbookId: string | null;
  errorMessage: string | null;
}

interface WorldbookDraftSessionsContextValue {
  sessions: Record<string, WorldbookDraftRecord>;
  setSessionForm: (
    sessionKey: string,
    update: SetStateAction<WorldbookEditorFormState>,
  ) => void;
  setSessionError: (sessionKey: string, message: string | null) => void;
  setSessionFromWorldbook: (
    sessionKey: string,
    worldbook: WorldbookDetailResponse,
  ) => void;
  moveSessionToWorldbook: (
    fromSessionKey: string,
    toSessionKey: string,
    worldbook: WorldbookDetailResponse,
  ) => void;
  retainSessionKeys: (sessionKeys: string[]) => void;
}

export interface WorldbookDraftSession {
  form: WorldbookEditorFormState;
  setForm: Dispatch<SetStateAction<WorldbookEditorFormState>>;
  isPending: boolean;
  visibleError: string | null;
  worldbook: WorldbookDetailResponse | undefined;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const emptyWorldbookDraftRecord: WorldbookDraftRecord = {
  form: emptyWorldbookEditorForm,
  loadedWorldbookId: null,
  errorMessage: null,
};

const WorldbookDraftSessionsContext =
  createContext<WorldbookDraftSessionsContextValue | null>(null);

export function WorldbookDraftSessionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sessions, setSessions] = useState<
    Record<string, WorldbookDraftRecord>
  >({});

  const setSessionForm = useCallback(
    (sessionKey: string, update: SetStateAction<WorldbookEditorFormState>) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyWorldbookDraftRecord;
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
        const current = items[sessionKey] ?? emptyWorldbookDraftRecord;
        return {
          ...items,
          [sessionKey]: { ...current, errorMessage: message },
        };
      });
    },
    [],
  );

  const setSessionFromWorldbook = useCallback(
    (sessionKey: string, worldbook: WorldbookDetailResponse) => {
      setSessions((items) => ({
        ...items,
        [sessionKey]: {
          form: worldbookEditorFormFromDetail(worldbook),
          loadedWorldbookId: worldbook.id,
          errorMessage: null,
        },
      }));
    },
    [],
  );

  const moveSessionToWorldbook = useCallback(
    (
      fromSessionKey: string,
      toSessionKey: string,
      worldbook: WorldbookDetailResponse,
    ) => {
      setSessions((items) => {
        const remainingItems = { ...items };
        delete remainingItems[fromSessionKey];

        return {
          ...remainingItems,
          [toSessionKey]: {
            form: worldbookEditorFormFromDetail(worldbook),
            loadedWorldbookId: worldbook.id,
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
      setSessionFromWorldbook,
      moveSessionToWorldbook,
      retainSessionKeys,
    }),
    [
      moveSessionToWorldbook,
      retainSessionKeys,
      sessions,
      setSessionError,
      setSessionForm,
      setSessionFromWorldbook,
    ],
  );

  return (
    <WorldbookDraftSessionsContext.Provider value={value}>
      {children}
    </WorldbookDraftSessionsContext.Provider>
  );
}

export function useWorldbookDraftSession({
  sessionKey,
  worldbookId,
  onCreated,
}: {
  sessionKey: string;
  worldbookId?: string;
  onCreated?: (worldbook: WorldbookDetailResponse) => void;
}): WorldbookDraftSession {
  const { t } = useTranslation();
  const context = useContext(WorldbookDraftSessionsContext);

  if (!context) {
    throw new Error("useWorldbookDraftSession must be used inside provider");
  }

  const { sessions, setSessionError, setSessionForm, setSessionFromWorldbook } =
    context;
  const queryClient = useQueryClient();
  const draft = sessions[sessionKey] ?? emptyWorldbookDraftRecord;
  const worldbookQuery = useQuery({
    enabled: Boolean(worldbookId),
    queryKey: ["worldbook", worldbookId],
    queryFn: () => getWorldbook(worldbookId!),
  });

  useEffect(() => {
    if (
      worldbookQuery.data &&
      draft.loadedWorldbookId !== worldbookQuery.data.id
    ) {
      setSessionFromWorldbook(sessionKey, worldbookQuery.data);
    }
  }, [
    draft.loadedWorldbookId,
    sessionKey,
    setSessionFromWorldbook,
    worldbookQuery.data,
  ]);

  const saveMutation = useMutation({
    mutationFn: (values: ReturnType<typeof worldbookValuesFromForm>) =>
      worldbookId
        ? updateWorldbook(worldbookId, values)
        : createWorldbook(values),
    async onSuccess(worldbook) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(["worldbook", worldbook.id], worldbook);
      onCreated?.(worldbook);
    },
  });

  const setForm = useCallback(
    (update: SetStateAction<WorldbookEditorFormState>) => {
      setSessionForm(sessionKey, update);
    },
    [sessionKey, setSessionForm],
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSessionError(sessionKey, null);

      if (!draft.form.name.trim()) {
        setSessionError(sessionKey, t("worldbooks.editor.errors.nameRequired"));
        return;
      }

      saveMutation.mutate(worldbookValuesFromForm(draft.form));
    },
    [draft.form, saveMutation, sessionKey, setSessionError, t],
  );

  let visibleError: string | null = null;

  if (draft.errorMessage) {
    visibleError = draft.errorMessage;
  } else if (saveMutation.isError) {
    visibleError = t("worldbooks.editor.errors.saveFailed");
  }

  return useMemo(
    () => ({
      form: draft.form,
      setForm,
      isPending: saveMutation.isPending || worldbookQuery.isLoading,
      visibleError,
      worldbook: worldbookQuery.data,
      submit,
    }),
    [
      draft.form,
      saveMutation.isPending,
      setForm,
      submit,
      visibleError,
      worldbookQuery.data,
      worldbookQuery.isLoading,
    ],
  );
}

export function useRetainWorldbookDraftSessions(sessionKeys: string[]) {
  const context = useContext(WorldbookDraftSessionsContext);

  if (!context) {
    throw new Error(
      "useRetainWorldbookDraftSessions must be used inside provider",
    );
  }

  const { retainSessionKeys } = context;

  useEffect(() => {
    retainSessionKeys(sessionKeys);
  }, [retainSessionKeys, sessionKeys]);
}

export function useWorldbookDraftSessionActions() {
  const context = useContext(WorldbookDraftSessionsContext);

  if (!context) {
    throw new Error(
      "useWorldbookDraftSessionActions must be used inside provider",
    );
  }

  return useMemo(
    () => ({ moveSessionToWorldbook: context.moveSessionToWorldbook }),
    [context.moveSessionToWorldbook],
  );
}
