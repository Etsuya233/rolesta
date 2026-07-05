import type {
  CharacterCreateValues,
  CharacterDetailResponse,
  CharacterFormValues,
} from "../api/characters-api";

export interface CharacterEditorFormState {
  visibility: "private" | "public";
  name: string;
  comment: string;
  tagsText: string;
  version: string;
  description: string;
  firstMessage: string;
  personality: string;
  scenario: string;
  creatorNotes: string;
  messageExample: string;
  alternateGreetings: string[];
  systemPrompt: string;
  postHistoryInstructions: string;
  creator: string;
  nickname: string;
}

export type EditableCharacterValues = CharacterCreateValues &
  CharacterFormValues;

export const emptyCharacterEditorForm: CharacterEditorFormState = {
  visibility: "private",
  name: "",
  comment: "",
  tagsText: "",
  version: "",
  description: "",
  firstMessage: "",
  personality: "",
  scenario: "",
  creatorNotes: "",
  messageExample: "",
  alternateGreetings: [],
  systemPrompt: "",
  postHistoryInstructions: "",
  creator: "",
  nickname: "",
};

export function characterEditorFormFromDetail(
  character: CharacterDetailResponse,
): CharacterEditorFormState {
  return {
    visibility: character.visibility,
    name: character.name,
    comment: character.comment,
    tagsText: character.tags.join(", "),
    version: character.version,
    description: character.description,
    firstMessage: character.firstMessage,
    personality: character.personality,
    scenario: character.scenario,
    creatorNotes: character.creatorNotes,
    messageExample: character.messageExample,
    alternateGreetings: character.alternateGreetings,
    systemPrompt: character.systemPrompt,
    postHistoryInstructions: character.postHistoryInstructions,
    creator: character.creator ?? "",
    nickname: character.nickname ?? "",
  };
}

export function characterEditorValuesFromForm(
  form: CharacterEditorFormState,
): EditableCharacterValues {
  return {
    visibility: form.visibility,
    name: form.name.trim(),
    comment: form.comment,
    tags: characterTagsFromText(form.tagsText),
    version: form.version,
    description: form.description,
    firstMessage: form.firstMessage,
    personality: form.personality,
    scenario: form.scenario,
    creatorNotes: form.creatorNotes,
    messageExample: form.messageExample,
    alternateGreetings: form.alternateGreetings,
    systemPrompt: form.systemPrompt,
    postHistoryInstructions: form.postHistoryInstructions,
    creator: form.creator.trim() ? form.creator.trim() : null,
    nickname: form.nickname.trim() ? form.nickname.trim() : null,
  };
}

function characterTagsFromText(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
