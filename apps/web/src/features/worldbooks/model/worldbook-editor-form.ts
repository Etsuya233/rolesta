import type {
  WorldbookDetailResponse,
  WorldbookEntryRole,
  WorldbookEntryResponse,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
  WorldbookVisibility,
} from "../api/worldbooks-api";

export interface WorldbookEditorFormState {
  name: string;
  description: string;
  tagsText: string;
  visibility: WorldbookVisibility;
  scanDepth: number;
  tokenBudget: number;
  recursiveScan: boolean;
}

export interface WorldbookEntryEditorFormState {
  enabled: boolean;
  name: string;
  comment: string;
  content: string;
  primaryKeysText: string;
  secondaryKeysText: string;
  selective: boolean;
  selectiveLogic: WorldbookSelectiveLogic;
  constant: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  insertionPosition: WorldbookInsertionPosition;
  insertionOrder: number;
  depth: number;
  insertionRole: WorldbookEntryRole;
  anchorName: string;
  scanDepth: number | null;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: boolean;
  probability: number;
}

export const emptyWorldbookEditorForm: WorldbookEditorFormState = {
  name: "",
  description: "",
  tagsText: "",
  visibility: "private",
  scanDepth: 3,
  tokenBudget: 1024,
  recursiveScan: false,
};

export const emptyWorldbookEntryEditorForm: WorldbookEntryEditorFormState = {
  enabled: true,
  name: "",
  comment: "",
  content: "",
  primaryKeysText: "",
  secondaryKeysText: "",
  selective: false,
  selectiveLogic: "andAny",
  constant: false,
  caseSensitive: false,
  matchWholeWords: false,
  insertionPosition: "beforeCharacterDefinition",
  insertionOrder: 0,
  depth: 3,
  insertionRole: "system",
  anchorName: "",
  scanDepth: null,
  excludeRecursion: false,
  preventRecursion: false,
  delayUntilRecursion: false,
  probability: 100,
};

export function worldbookEditorFormFromDetail(
  worldbook: WorldbookDetailResponse,
): WorldbookEditorFormState {
  return {
    name: worldbook.name,
    description: worldbook.description,
    tagsText: worldbook.tags.join(", "),
    visibility: worldbook.visibility,
    scanDepth: worldbook.scanDepth,
    tokenBudget: worldbook.tokenBudget,
    recursiveScan: worldbook.recursiveScan,
  };
}

export function worldbookEntryEditorFormFromEntry(
  entry: WorldbookEntryResponse,
): WorldbookEntryEditorFormState {
  return {
    enabled: entry.enabled,
    name: entry.name,
    comment: entry.comment,
    content: entry.content,
    primaryKeysText: entry.primaryKeys.join(", "),
    secondaryKeysText: entry.secondaryKeys.join(", "),
    selective: entry.selective,
    selectiveLogic: entry.selectiveLogic,
    constant: entry.constant,
    caseSensitive: entry.caseSensitive,
    matchWholeWords: entry.matchWholeWords,
    insertionPosition: entry.insertionPosition,
    insertionOrder: entry.insertionOrder,
    depth: entry.depth,
    insertionRole: entry.insertionRole,
    anchorName: entry.anchorName,
    scanDepth: entry.scanDepth,
    excludeRecursion: entry.excludeRecursion,
    preventRecursion: entry.preventRecursion,
    delayUntilRecursion: entry.delayUntilRecursion,
    probability: entry.probability,
  };
}

export function worldbookValuesFromForm(form: WorldbookEditorFormState) {
  return {
    name: form.name.trim(),
    description: form.description,
    tags: textListFromInput(form.tagsText),
    visibility: form.visibility,
    scanDepth: form.scanDepth,
    tokenBudget: form.tokenBudget,
    recursiveScan: form.recursiveScan,
  };
}

export function worldbookEntryValuesFromForm(
  form: WorldbookEntryEditorFormState,
  mode: "create" | "update",
) {
  return {
    ...(mode === "create" ? { enabled: form.enabled } : {}),
    name: form.name.trim(),
    comment: form.comment,
    content: form.content,
    primaryKeys: textListFromInput(form.primaryKeysText),
    secondaryKeys: textListFromInput(form.secondaryKeysText),
    selective: form.selective,
    selectiveLogic: form.selectiveLogic,
    constant: form.constant,
    caseSensitive: form.caseSensitive,
    matchWholeWords: form.matchWholeWords,
    insertionPosition: form.insertionPosition,
    ...(mode === "update" ? { insertionOrder: form.insertionOrder } : {}),
    depth: form.depth,
    insertionRole: form.insertionRole,
    anchorName: form.anchorName.trim(),
    scanDepth: form.scanDepth,
    excludeRecursion: form.excludeRecursion,
    preventRecursion: form.preventRecursion,
    delayUntilRecursion: form.delayUntilRecursion,
    probability: form.probability,
  };
}

function textListFromInput(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
