import type {
  WorldbookDetailResponse,
  WorldbookDocument,
  WorldbookEntryRole,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
  WorldbookVisibility,
} from '../api/worldbooks-api';

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
  vectorized: boolean;
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
  name: '',
  description: '',
  tagsText: '',
  visibility: 'private',
  scanDepth: 3,
  tokenBudget: 1024,
  recursiveScan: false,
};

export const emptyWorldbookEntryEditorForm: WorldbookEntryEditorFormState = {
  enabled: true,
  name: '',
  comment: '',
  content: '',
  primaryKeysText: '',
  secondaryKeysText: '',
  selective: false,
  selectiveLogic: 'andAny',
  constant: false,
  vectorized: false,
  caseSensitive: false,
  matchWholeWords: false,
  insertionPosition: 'beforeCharacterDefinition',
  insertionOrder: 0,
  depth: 3,
  insertionRole: 'system',
  anchorName: '',
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
    tagsText: worldbook.tags.join(', '),
    visibility: worldbook.visibility,
    scanDepth: worldbook.scanDepth,
    tokenBudget: worldbook.tokenBudget,
    recursiveScan: worldbook.recursiveScan,
  };
}

export function worldbookEntryEditorFormFromEntry(
  entry: WorldbookDocument['entries'][number],
  insertionOrder: number,
): WorldbookEntryEditorFormState {
  return {
    enabled: entry.enabled,
    name: entry.name,
    comment: entry.comment,
    content: entry.content,
    primaryKeysText: entry.primaryKeys.join(', '),
    secondaryKeysText: entry.secondaryKeys.join(', '),
    selective: entry.selective,
    selectiveLogic: entry.selectiveLogic,
    constant: entry.constant,
    vectorized: entry.vectorized,
    caseSensitive: entry.caseSensitive,
    matchWholeWords: entry.matchWholeWords,
    insertionPosition: entry.insertionPosition,
    insertionOrder,
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

export function worldbookEntryValuesFromForm(form: WorldbookEntryEditorFormState) {
  return {
    enabled: form.enabled,
    name: form.name.trim(),
    comment: form.comment,
    content: form.content,
    primaryKeys: textListFromInput(form.primaryKeysText),
    secondaryKeys: textListFromInput(form.secondaryKeysText),
    selective: form.selective,
    selectiveLogic: form.selectiveLogic,
    constant: form.constant,
    vectorized: form.vectorized,
    caseSensitive: form.caseSensitive,
    matchWholeWords: form.matchWholeWords,
    insertionPosition: form.insertionPosition,
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

export function worldbookDocumentFromDetail(worldbook: WorldbookDetailResponse): WorldbookDocument {
  return {
    visibility: worldbook.visibility,
    name: worldbook.name,
    description: worldbook.description,
    tags: worldbook.tags,
    scanDepth: worldbook.scanDepth,
    tokenBudget: worldbook.tokenBudget,
    recursiveScan: worldbook.recursiveScan,
    entries: [...worldbook.entries]
      .sort((left, right) => left.insertionOrder - right.insertionOrder)
      .map((entry) => ({
        id: entry.id,
        enabled: entry.enabled,
        name: entry.name,
        comment: entry.comment,
        content: entry.content,
        primaryKeys: entry.primaryKeys,
        secondaryKeys: entry.secondaryKeys,
        selective: entry.selective,
        selectiveLogic: entry.selectiveLogic,
        constant: entry.constant,
        vectorized: entry.vectorized,
        caseSensitive: entry.caseSensitive,
        matchWholeWords: entry.matchWholeWords,
        insertionPosition: entry.insertionPosition,
        depth: entry.depth,
        insertionRole: entry.insertionRole,
        anchorName: entry.anchorName,
        scanDepth: entry.scanDepth,
        excludeRecursion: entry.excludeRecursion,
        preventRecursion: entry.preventRecursion,
        delayUntilRecursion: entry.delayUntilRecursion,
        probability: entry.probability,
      })),
  };
}

export function worldbookDocumentEquals(
  left: WorldbookDocument,
  right: WorldbookDocument,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function textListFromInput(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
