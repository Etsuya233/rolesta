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
import {
  createCharacter,
  getCharacter,
  updateCharacter,
  type CharacterDetailResponse,
} from "../api/characters-api";
import {
  characterEditorFormFromDetail,
  characterEditorValuesFromForm,
  emptyCharacterEditorForm,
  type CharacterEditorFormState,
  type EditableCharacterValues,
} from "../model/character-editor-form";

interface CharacterDraftRecord {
  form: CharacterEditorFormState;
  errorMessage: string | null;
}

interface CharacterDraftSessionsContextValue {
  sessions: Record<string, CharacterDraftRecord>;
  setSessionForm: (
    sessionKey: string,
    update: SetStateAction<CharacterEditorFormState>,
  ) => void;
  setSessionError: (sessionKey: string, message: string | null) => void;
  setSessionFromCharacter: (
    sessionKey: string,
    character: CharacterDetailResponse,
  ) => void;
  moveSessionToCharacter: (
    fromSessionKey: string,
    toSessionKey: string,
    character: CharacterDetailResponse,
  ) => void;
  retainSessionKeys: (sessionKeys: string[]) => void;
}

export interface CharacterDraftSession {
  form: CharacterEditorFormState;
  setForm: Dispatch<SetStateAction<CharacterEditorFormState>>;
  isPending: boolean;
  visibleError: string | null;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

const emptyCharacterDraftRecord: CharacterDraftRecord = {
  form: emptyCharacterEditorForm,
  errorMessage: null,
};

const CharacterDraftSessionsContext =
  createContext<CharacterDraftSessionsContextValue | null>(null);

export function CharacterDraftSessionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sessions, setSessions] = useState<
    Record<string, CharacterDraftRecord>
  >({});

  const setSessionForm = useCallback(
    (sessionKey: string, update: SetStateAction<CharacterEditorFormState>) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyCharacterDraftRecord;
        const form =
          typeof update === "function" ? update(current.form) : update;

        return {
          ...items,
          [sessionKey]: {
            ...current,
            form,
          },
        };
      });
    },
    [],
  );

  const setSessionError = useCallback(
    (sessionKey: string, message: string | null) => {
      setSessions((items) => {
        const current = items[sessionKey] ?? emptyCharacterDraftRecord;

        return {
          ...items,
          [sessionKey]: {
            ...current,
            errorMessage: message,
          },
        };
      });
    },
    [],
  );

  const setSessionFromCharacter = useCallback(
    (sessionKey: string, character: CharacterDetailResponse) => {
      setSessions((items) => ({
        ...items,
        [sessionKey]: {
          form: characterEditorFormFromDetail(character),
          errorMessage: null,
        },
      }));
    },
    [],
  );

  const moveSessionToCharacter = useCallback(
    (
      fromSessionKey: string,
      toSessionKey: string,
      character: CharacterDetailResponse,
    ) => {
      setSessions((items) => {
        const remainingItems = { ...items };
        delete remainingItems[fromSessionKey];

        return {
          ...remainingItems,
          [toSessionKey]: {
            form: characterEditorFormFromDetail(character),
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
      const entries = Object.entries(items).filter(([sessionKey]) =>
        retainedKeys.has(sessionKey),
      );

      if (entries.length === Object.keys(items).length) {
        return items;
      }

      return Object.fromEntries(entries);
    });
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      setSessionForm,
      setSessionError,
      setSessionFromCharacter,
      moveSessionToCharacter,
      retainSessionKeys,
    }),
    [
      moveSessionToCharacter,
      retainSessionKeys,
      sessions,
      setSessionError,
      setSessionForm,
      setSessionFromCharacter,
    ],
  );

  return (
    <CharacterDraftSessionsContext.Provider value={value}>
      {children}
    </CharacterDraftSessionsContext.Provider>
  );
}

export function useCharacterDraftSession({
  sessionKey,
  characterId,
  hydrateFromQueryOnMount = false,
  onCreated,
}: {
  sessionKey: string;
  characterId?: string;
  hydrateFromQueryOnMount?: boolean;
  onCreated?: (character: CharacterDetailResponse) => void;
}): CharacterDraftSession {
  const { t } = useTranslation();
  const context = useContext(CharacterDraftSessionsContext);

  if (!context) {
    throw new Error(
      "useCharacterDraftSession must be used inside CharacterDraftSessionsProvider",
    );
  }

  const { sessions, setSessionError, setSessionForm, setSessionFromCharacter } =
    context;
  const queryClient = useQueryClient();
  const draft = sessions[sessionKey] ?? emptyCharacterDraftRecord;
  const isEditing = Boolean(characterId);
  const hydratedCharacterId = useRef<string | null>(null);

  const characterQuery = useQuery({
    enabled: isEditing,
    queryKey: ["character", characterId],
    queryFn: () => getCharacter(characterId!),
  });
  const form =
    hydrateFromQueryOnMount &&
    characterQuery.data &&
    hydratedCharacterId.current !== characterQuery.data.id
      ? characterEditorFormFromDetail(characterQuery.data)
      : draft.form;

  useEffect(() => {
    if (
      hydrateFromQueryOnMount &&
      characterQuery.data &&
      hydratedCharacterId.current !== characterQuery.data.id
    ) {
      setSessionFromCharacter(sessionKey, characterQuery.data);
      hydratedCharacterId.current = characterQuery.data.id;
    }
  }, [
    characterQuery.data,
    hydrateFromQueryOnMount,
    sessionKey,
    setSessionFromCharacter,
  ]);

  const saveMutation = useMutation({
    mutationFn: (values: EditableCharacterValues) =>
      characterId
        ? updateCharacter(characterId, values)
        : createCharacter(values),
    async onSuccess(character) {
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.setQueryData(["character", character.id], character);

      if (!characterId) {
        onCreated?.(character);
      }
    },
  });

  const setForm = useCallback(
    (update: SetStateAction<CharacterEditorFormState>) => {
      setSessionForm(sessionKey, update);
    },
    [sessionKey, setSessionForm],
  );

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSessionError(sessionKey, null);

      if (!form.name.trim()) {
        setSessionError(sessionKey, "characters.editor.errors.nameRequired");
        return;
      }

      saveMutation.mutate(characterEditorValuesFromForm(form));
    },
    [form, saveMutation, sessionKey, setSessionError],
  );

  let visibleError: string | null = null;

  if (draft.errorMessage) {
    visibleError = t(draft.errorMessage);
  } else if (saveMutation.isError) {
    visibleError = t("characters.editor.errors.saveFailed");
  }
  const isPending = saveMutation.isPending || characterQuery.isLoading;

  return useMemo(
    () => ({
      form,
      setForm,
      isPending,
      visibleError,
      submit,
    }),
    [form, isPending, setForm, submit, visibleError],
  );
}

export function useRetainCharacterDraftSessions(sessionKeys: string[]) {
  const context = useContext(CharacterDraftSessionsContext);

  if (!context) {
    throw new Error(
      "useRetainCharacterDraftSessions must be used inside CharacterDraftSessionsProvider",
    );
  }

  const { retainSessionKeys } = context;

  useEffect(() => {
    retainSessionKeys(sessionKeys);
  }, [retainSessionKeys, sessionKeys]);
}

export function useCharacterDraftSessionActions() {
  const context = useContext(CharacterDraftSessionsContext);

  if (!context) {
    throw new Error(
      "useCharacterDraftSessionActions must be used inside CharacterDraftSessionsProvider",
    );
  }

  return useMemo(
    () => ({
      moveSessionToCharacter: context.moveSessionToCharacter,
    }),
    [context.moveSessionToCharacter],
  );
}
