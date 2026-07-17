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
  ignoreBudget: boolean;
  useProbability: boolean;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchCharacterDepthPrompt: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  insertionPosition: WorldbookInsertionPosition;
  insertionOrder: number;
  depth: number;
  insertionRole: WorldbookEntryRole;
  anchorName: string;
  scanDepth: number | null;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: number;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  useGroupScoring: boolean | null;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  characterFilterNamesText: string;
  characterFilterTagsText: string;
  characterFilterExclude: boolean;
  triggers: WorldbookDocument['entries'][number]['triggers'];
  automationId: string;
  addMemo: boolean;
  probability: number;
}

export const emptyWorldbookEditorForm: WorldbookEditorFormState = {
  name: '',
  description: '',
  tagsText: '',
  visibility: 'private',
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
  ignoreBudget: false,
  useProbability: true,
  caseSensitive: null,
  matchWholeWords: null,
  matchPersonaDescription: false,
  matchCharacterDescription: false,
  matchCharacterPersonality: false,
  matchCharacterDepthPrompt: false,
  matchScenario: false,
  matchCreatorNotes: false,
  insertionPosition: 'beforeCharacterDefinition',
  insertionOrder: 100,
  depth: 4,
  insertionRole: 'system',
  anchorName: '',
  scanDepth: null,
  excludeRecursion: false,
  preventRecursion: false,
  delayUntilRecursion: 0,
  group: '',
  groupOverride: false,
  groupWeight: 100,
  useGroupScoring: null,
  sticky: null,
  cooldown: null,
  delay: null,
  characterFilterNamesText: '',
  characterFilterTagsText: '',
  characterFilterExclude: false,
  triggers: [],
  automationId: '',
  addMemo: false,
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
  };
}

export function worldbookEntryEditorFormFromEntry(
  entry: WorldbookDocument['entries'][number],
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
    ignoreBudget: entry.ignoreBudget,
    useProbability: entry.useProbability,
    caseSensitive: entry.caseSensitive,
    matchWholeWords: entry.matchWholeWords,
    matchPersonaDescription: entry.matchPersonaDescription,
    matchCharacterDescription: entry.matchCharacterDescription,
    matchCharacterPersonality: entry.matchCharacterPersonality,
    matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt,
    matchScenario: entry.matchScenario,
    matchCreatorNotes: entry.matchCreatorNotes,
    insertionPosition: entry.insertionPosition,
    insertionOrder: entry.insertionOrder,
    depth: entry.depth,
    insertionRole: entry.insertionRole,
    anchorName: entry.anchorName,
    scanDepth: entry.scanDepth,
    excludeRecursion: entry.excludeRecursion,
    preventRecursion: entry.preventRecursion,
    delayUntilRecursion: entry.delayUntilRecursion,
    group: entry.group,
    groupOverride: entry.groupOverride,
    groupWeight: entry.groupWeight,
    useGroupScoring: entry.useGroupScoring,
    sticky: entry.sticky,
    cooldown: entry.cooldown,
    delay: entry.delay,
    characterFilterNamesText: entry.characterFilterNames.join(', '),
    characterFilterTagsText: entry.characterFilterTags.join(', '),
    characterFilterExclude: entry.characterFilterExclude,
    triggers: entry.triggers,
    automationId: entry.automationId,
    addMemo: entry.addMemo,
    probability: entry.probability,
  };
}

export function worldbookValuesFromForm(form: WorldbookEditorFormState) {
  return {
    name: form.name.trim(),
    description: form.description,
    tags: textListFromInput(form.tagsText),
    visibility: form.visibility,
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
    ignoreBudget: form.ignoreBudget,
    useProbability: form.useProbability,
    caseSensitive: form.caseSensitive,
    matchWholeWords: form.matchWholeWords,
    matchPersonaDescription: form.matchPersonaDescription,
    matchCharacterDescription: form.matchCharacterDescription,
    matchCharacterPersonality: form.matchCharacterPersonality,
    matchCharacterDepthPrompt: form.matchCharacterDepthPrompt,
    matchScenario: form.matchScenario,
    matchCreatorNotes: form.matchCreatorNotes,
    insertionPosition: form.insertionPosition,
    insertionOrder: form.insertionOrder,
    depth: form.depth,
    insertionRole: form.insertionRole,
    anchorName: form.anchorName.trim(),
    scanDepth: form.scanDepth,
    excludeRecursion: form.excludeRecursion,
    preventRecursion: form.preventRecursion,
    delayUntilRecursion: form.delayUntilRecursion,
    group: form.group,
    groupOverride: form.groupOverride,
    groupWeight: form.groupWeight,
    useGroupScoring: form.useGroupScoring,
    sticky: form.sticky,
    cooldown: form.cooldown,
    delay: form.delay,
    characterFilterNames: textListFromInput(form.characterFilterNamesText),
    characterFilterTags: textListFromInput(form.characterFilterTagsText),
    characterFilterExclude: form.characterFilterExclude,
    triggers: form.triggers,
    automationId: form.automationId,
    addMemo: form.addMemo,
    probability: form.probability,
  };
}

export function worldbookDocumentFromDetail(worldbook: WorldbookDetailResponse): WorldbookDocument {
  return {
    visibility: worldbook.visibility,
    name: worldbook.name,
    description: worldbook.description,
    tags: worldbook.tags,
    entries: [...worldbook.entries]
      .sort((left, right) => left.displayIndex - right.displayIndex)
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
        ignoreBudget: entry.ignoreBudget,
        useProbability: entry.useProbability,
        caseSensitive: entry.caseSensitive,
        matchWholeWords: entry.matchWholeWords,
        matchPersonaDescription: entry.matchPersonaDescription,
        matchCharacterDescription: entry.matchCharacterDescription,
        matchCharacterPersonality: entry.matchCharacterPersonality,
        matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt,
        matchScenario: entry.matchScenario,
        matchCreatorNotes: entry.matchCreatorNotes,
        insertionPosition: entry.insertionPosition,
        insertionOrder: entry.insertionOrder,
        depth: entry.depth,
        insertionRole: entry.insertionRole,
        anchorName: entry.anchorName,
        scanDepth: entry.scanDepth,
        excludeRecursion: entry.excludeRecursion,
        preventRecursion: entry.preventRecursion,
        delayUntilRecursion: entry.delayUntilRecursion,
        group: entry.group,
        groupOverride: entry.groupOverride,
        groupWeight: entry.groupWeight,
        useGroupScoring: entry.useGroupScoring,
        sticky: entry.sticky,
        cooldown: entry.cooldown,
        delay: entry.delay,
        characterFilterNames: entry.characterFilterNames,
        characterFilterTags: entry.characterFilterTags,
        characterFilterExclude: entry.characterFilterExclude,
        triggers: entry.triggers,
        automationId: entry.automationId,
        addMemo: entry.addMemo,
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
