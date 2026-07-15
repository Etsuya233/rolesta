import {
  chatTitleSchema,
  createChatInputSchema,
  updateChatInputSchema,
  type ValidationIssue,
  validationIssuesFromZodError,
} from "@rolesta/shared";
import type {
  ChatDetail,
  CreateChatValues,
  UpdateChatValues,
} from "../api/chats-api";

export type ModelFieldSource = "unset" | "user-default" | "owned-preset" | "manual";

export interface ChatFormState {
  title: string;
  titleEdited: boolean;
  chatCharacterId: string;
  personaCharacterId: string | null;
  presetId: string | null;
  modelProviderId: string | null;
  personaTouched: boolean;
  presetTouched: boolean;
  modelSource: ModelFieldSource;
}

export function emptyCreateChatForm(): ChatFormState {
  return {
    title: "",
    titleEdited: false,
    chatCharacterId: "",
    personaCharacterId: null,
    presetId: null,
    modelProviderId: null,
    personaTouched: false,
    presetTouched: false,
    modelSource: "unset",
  };
}

export function editChatForm(chat: ChatDetail): ChatFormState {
  return {
    title: chat.title,
    titleEdited: true,
    chatCharacterId: chat.chatCharacterId ?? "",
    personaCharacterId: chat.personaCharacterId,
    presetId: chat.presetId,
    modelProviderId: chat.modelProviderId,
    personaTouched: true,
    presetTouched: true,
    modelSource: chat.modelProviderId === null ? "unset" : "manual",
  };
}

export function selectChatCharacter(
  state: ChatFormState,
  characterId: string,
  characterName: string,
): ChatFormState {
  return {
    ...state,
    chatCharacterId: characterId,
    title: state.titleEdited ? state.title : characterName,
  };
}

export function editChatTitle(state: ChatFormState, title: string): ChatFormState {
  return { ...state, title, titleEdited: true };
}

export function applyAssetDefaults(
  state: ChatFormState,
  defaults: {
    personaCharacterId: string | null;
    presetId: string | null;
    modelProviderId: string | null;
  },
): ChatFormState {
  return {
    ...state,
    personaCharacterId: state.personaTouched
      ? state.personaCharacterId
      : defaults.personaCharacterId,
    presetId: state.presetTouched ? state.presetId : defaults.presetId,
    modelProviderId:
      state.modelSource === "unset" ? defaults.modelProviderId : state.modelProviderId,
    modelSource:
      state.modelSource === "unset" && defaults.modelProviderId !== null
        ? "user-default"
        : state.modelSource,
  };
}

export function selectPreset(state: ChatFormState, presetId: string | null): ChatFormState {
  return { ...state, presetId, presetTouched: true };
}

export function applyOwnedPresetModel(
  state: ChatFormState,
  modelProviderId: string | null,
): ChatFormState {
  if (
    modelProviderId === null ||
    (state.modelSource !== "unset" && state.modelSource !== "user-default")
  ) {
    return state;
  }
  return { ...state, modelProviderId, modelSource: "owned-preset" };
}

export function selectModelProvider(
  state: ChatFormState,
  modelProviderId: string | null,
): ChatFormState {
  return { ...state, modelProviderId, modelSource: "manual" };
}

export function validateChatForm(state: ChatFormState): {
  values: CreateChatValues | null;
  issues: ValidationIssue[];
} {
  const result = createChatInputSchema.safeParse({
    title: state.title,
    chatCharacterId: state.chatCharacterId,
    personaCharacterId: state.personaCharacterId,
    presetId: state.presetId,
    modelProviderId: state.modelProviderId,
  });
  return result.success
    ? {
        values: {
          title: chatTitleSchema.parse(state.title),
          chatCharacterId: state.chatCharacterId,
          personaCharacterId: state.personaCharacterId,
          presetId: state.presetId,
          modelProviderId: state.modelProviderId,
        },
        issues: [],
      }
    : { values: null, issues: validationIssuesFromZodError(result.error) };
}

export function isChatFormDirty(state: ChatFormState, chat: ChatDetail): boolean {
  const title = chatTitleSchema.safeParse(state.title);
  return (
    (title.success ? title.data : state.title) !== chat.title ||
    (state.chatCharacterId || null) !== chat.chatCharacterId ||
    state.personaCharacterId !== chat.personaCharacterId ||
    state.presetId !== chat.presetId ||
    state.modelProviderId !== chat.modelProviderId
  );
}

export function validateChatEdit(
  state: ChatFormState,
): { values: UpdateChatValues | null; issues: ValidationIssue[] } {
  const result = updateChatInputSchema.safeParse({
    title: state.title,
    ...(state.chatCharacterId.length > 0
      ? { chatCharacterId: state.chatCharacterId }
      : {}),
    personaCharacterId: state.personaCharacterId,
    presetId: state.presetId,
    modelProviderId: state.modelProviderId,
  });
  return result.success
    ? {
        values: {
          title: chatTitleSchema.parse(state.title),
          ...(state.chatCharacterId.length > 0
            ? { chatCharacterId: state.chatCharacterId }
            : {}),
          personaCharacterId: state.personaCharacterId,
          presetId: state.presetId,
          modelProviderId: state.modelProviderId,
        },
        issues: [],
      }
    : { values: null, issues: validationIssuesFromZodError(result.error) };
}
