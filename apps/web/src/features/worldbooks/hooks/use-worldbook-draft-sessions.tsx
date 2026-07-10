import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "react";
import { useTranslation } from "react-i18next";
import { getFormErrorMessage } from "../../../lib/forms/form-error";
import { notify } from "../../../lib/notifications/notify";
import {
  createWorldbook,
  getWorldbook,
  updateWorldbookDocument,
  type WorldbookDetailResponse,
  type WorldbookDocument,
} from "../api/worldbooks-api";
import {
  emptyWorldbookEditorForm,
  worldbookDocumentEquals,
  worldbookDocumentFromDetail,
  worldbookValuesFromForm,
  type WorldbookEditorFormState,
} from "../model/worldbook-editor-form";

interface WorldbookDraftRecord {
  baseline: WorldbookDocument;
  document: WorldbookDocument;
}

interface WorldbookDraftSessionsContextValue {
  sessions: Record<string, WorldbookDraftRecord>;
  setSessionDocument: (
    sessionKey: string,
    update: SetStateAction<WorldbookDocument>,
  ) => void;
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
  saveSession: (
    sessionKey: string,
    worldbookId: string,
    document: WorldbookDocument,
  ) => Promise<WorldbookDetailResponse>;
  savingSessionKey: string | null;
}

export interface WorldbookDraftSession {
  document: WorldbookDocument;
  setDocument: Dispatch<SetStateAction<WorldbookDocument>>;
  form: WorldbookEditorFormState;
  setForm: Dispatch<SetStateAction<WorldbookEditorFormState>>;
  isDirty: boolean;
  isPending: boolean;
  worldbook: WorldbookDetailResponse | undefined;
  acceptSavedWorldbook: (worldbook: WorldbookDetailResponse) => void;
  saveDocument: (
    document?: WorldbookDocument,
    onSaved?: (worldbook: WorldbookDetailResponse) => void,
  ) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const emptyWorldbookDocument: WorldbookDocument = {
  ...worldbookValuesFromForm(emptyWorldbookEditorForm),
  entries: [],
};

const emptyWorldbookDraftRecord: WorldbookDraftRecord = {
  baseline: emptyWorldbookDocument,
  document: emptyWorldbookDocument,
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
  const queryClient = useQueryClient();

  const setSessionDocument = useCallback(
    (sessionKey: string, update: SetStateAction<WorldbookDocument>) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyWorldbookDraftRecord;
        const document =
          typeof update === "function" ? update(current.document) : update;

        return { ...items, [sessionKey]: { ...current, document } };
      });
    },
    [],
  );

  const setSessionFromWorldbook = useCallback(
    (sessionKey: string, worldbook: WorldbookDetailResponse) => {
      const document = worldbookDocumentFromDetail(worldbook);
      setSessions((items) => ({
        ...items,
        [sessionKey]: {
          baseline: document,
          document,
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
      const document = worldbookDocumentFromDetail(worldbook);
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
      const entries = Object.entries(items).filter(([key]) =>
        retainedKeys.has(key),
      );

      return entries.length === Object.keys(items).length
        ? items
        : Object.fromEntries(entries);
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: ({
      worldbookId,
      document,
    }: {
      sessionKey: string;
      worldbookId: string;
      document: WorldbookDocument;
    }) => updateWorldbookDocument(worldbookId, document),
    async onSuccess(worldbook, variables) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(["worldbook", worldbook.id], worldbook);
      setSessionFromWorldbook(variables.sessionKey, worldbook);
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });
  const saveSession = useCallback(
    (sessionKey: string, worldbookId: string, document: WorldbookDocument) =>
      saveMutation.mutateAsync({ sessionKey, worldbookId, document }),
    [saveMutation],
  );
  const savingSessionKey = saveMutation.isPending
    ? (saveMutation.variables?.sessionKey ?? null)
    : null;

  const value = useMemo(
    () => ({
      sessions,
      setSessionDocument,
      setSessionFromWorldbook,
      moveSessionToWorldbook,
      retainSessionKeys,
      saveSession,
      savingSessionKey,
    }),
    [
      moveSessionToWorldbook,
      retainSessionKeys,
      saveSession,
      savingSessionKey,
      sessions,
      setSessionDocument,
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
  hydrateFromQueryOnMount = false,
  onCreated,
}: {
  sessionKey: string;
  worldbookId?: string;
  hydrateFromQueryOnMount?: boolean;
  onCreated?: (worldbook: WorldbookDetailResponse) => void;
}): WorldbookDraftSession {
  const { t } = useTranslation();
  const context = useWorldbookDraftSessionsContext();
  const {
    sessions,
    setSessionDocument,
    setSessionFromWorldbook,
    saveSession,
    savingSessionKey,
  } = context;
  const queryClient = useQueryClient();
  const draft = sessions[sessionKey] ?? emptyWorldbookDraftRecord;
  const hydratedWorldbookId = useRef<string | null>(null);
  const worldbookQuery = useQuery({
    enabled: Boolean(worldbookId),
    queryKey: ["worldbook", worldbookId],
    queryFn: () => getWorldbook(worldbookId!),
  });
  const queriedDocument =
    hydrateFromQueryOnMount &&
    worldbookQuery.data &&
    hydratedWorldbookId.current !== worldbookQuery.data.id
      ? worldbookDocumentFromDetail(worldbookQuery.data)
      : null;
  const document = queriedDocument ?? draft.document;
  const baseline = queriedDocument ?? draft.baseline;

  useEffect(() => {
    if (
      hydrateFromQueryOnMount &&
      worldbookQuery.data &&
      hydratedWorldbookId.current !== worldbookQuery.data.id
    ) {
      setSessionFromWorldbook(sessionKey, worldbookQuery.data);
      hydratedWorldbookId.current = worldbookQuery.data.id;
    }
  }, [
    sessionKey,
    setSessionFromWorldbook,
    hydrateFromQueryOnMount,
    worldbookQuery.data,
  ]);

  useEffect(() => {
    if (worldbookQuery.isError) {
      notify.error({ title: getFormErrorMessage(worldbookQuery.error) });
    }
  }, [worldbookQuery.error, worldbookQuery.isError]);

  const createMutation = useMutation({
    mutationFn: (document: WorldbookDocument) =>
      createWorldbook({
        visibility: document.visibility,
        name: document.name,
        description: document.description,
        tags: document.tags,
        scanDepth: document.scanDepth,
        tokenBudget: document.tokenBudget,
        recursiveScan: document.recursiveScan,
      }),
    async onSuccess(worldbook) {
      await queryClient.invalidateQueries({ queryKey: ["worldbooks"] });
      queryClient.setQueryData(["worldbook", worldbook.id], worldbook);
      setSessionFromWorldbook(sessionKey, worldbook);
      onCreated?.(worldbook);
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });

  const setDocument = useCallback(
    (update: SetStateAction<WorldbookDocument>) =>
      setSessionDocument(sessionKey, update),
    [sessionKey, setSessionDocument],
  );
  const form = useMemo<WorldbookEditorFormState>(
    () => ({
      name: document.name,
      description: document.description,
      tagsText: document.tags.join(", "),
      visibility: document.visibility,
      scanDepth: document.scanDepth,
      tokenBudget: document.tokenBudget,
      recursiveScan: document.recursiveScan,
    }),
    [document],
  );
  const setForm = useCallback(
    (update: SetStateAction<WorldbookEditorFormState>) => {
      setSessionDocument(sessionKey, (current) => {
        const currentForm: WorldbookEditorFormState = {
          name: current.name,
          description: current.description,
          tagsText: current.tags.join(", "),
          visibility: current.visibility,
          scanDepth: current.scanDepth,
          tokenBudget: current.tokenBudget,
          recursiveScan: current.recursiveScan,
        };
        const nextForm =
          typeof update === "function" ? update(currentForm) : update;

        return { ...current, ...worldbookValuesFromForm(nextForm) };
      });
    },
    [sessionKey, setSessionDocument],
  );
  const isDirty = !worldbookDocumentEquals(document, baseline);
  const saveDocument = useCallback(
    (
      documentToSave = document,
      onSaved?: (worldbook: WorldbookDetailResponse) => void,
    ) => {
      if (!documentToSave.name.trim()) {
        notify.error({
          title: t("worldbooks.editor.errors.nameRequired"),
        });
        return;
      }

      const normalizedDocument = {
        ...documentToSave,
        name: documentToSave.name.trim(),
      };
      setSessionDocument(sessionKey, normalizedDocument);

      if (worldbookId) {
        void saveSession(sessionKey, worldbookId, normalizedDocument)
          .then((worldbook) => onSaved?.(worldbook))
          .catch(() => undefined);
        return;
      }

      createMutation.mutate(normalizedDocument);
    },
    [
      createMutation,
      document,
      saveSession,
      sessionKey,
      setSessionDocument,
      t,
      worldbookId,
    ],
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
      isPending:
        createMutation.isPending ||
        savingSessionKey === sessionKey ||
        worldbookQuery.isLoading,
      worldbook: worldbookQuery.data,
      acceptSavedWorldbook: (worldbook: WorldbookDetailResponse) =>
        setSessionFromWorldbook(sessionKey, worldbook),
      saveDocument,
      submit,
    }),
    [
      createMutation.isPending,
      document,
      form,
      isDirty,
      saveDocument,
      savingSessionKey,
      sessionKey,
      setDocument,
      setForm,
      setSessionFromWorldbook,
      submit,
      worldbookQuery.data,
      worldbookQuery.isLoading,
    ],
  );
}

export function useRetainWorldbookDraftSessions(sessionKeys: string[]) {
  const { retainSessionKeys } = useWorldbookDraftSessionsContext();

  useEffect(() => {
    retainSessionKeys(sessionKeys);
  }, [retainSessionKeys, sessionKeys]);
}

export function useWorldbookDraftSessionActions() {
  const { moveSessionToWorldbook } = useWorldbookDraftSessionsContext();

  return useMemo(() => ({ moveSessionToWorldbook }), [moveSessionToWorldbook]);
}

function useWorldbookDraftSessionsContext(): WorldbookDraftSessionsContextValue {
  const context = useContext(WorldbookDraftSessionsContext);

  if (!context) {
    throw new Error("Worldbook draft hooks must be used inside provider");
  }

  return context;
}
