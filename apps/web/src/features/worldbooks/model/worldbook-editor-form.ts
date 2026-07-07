import type {
  WorldbookConditionLogic,
  WorldbookDepthRole,
  WorldbookDetailResponse,
  WorldbookEntryResponse,
  WorldbookGenerationTrigger,
  WorldbookInsertionPosition,
  WorldbookTriState,
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
  externalUid: number | null;
  enabled: boolean;
  name: string;
  addMemo: boolean;
  comment: string;
  content: string;
  primaryKeysText: string;
  secondaryKeysText: string;
  conditionLogic: WorldbookConditionLogic;
  selective: boolean;
  constant: boolean;
  vectorized: boolean;
  caseSensitive: WorldbookTriState;
  matchWholeWords: WorldbookTriState;
  insertionPosition: WorldbookInsertionPosition;
  depthRole: WorldbookDepthRole;
  insertionDepth: number;
  insertionOrder: number;
  displayOrder: number;
  useProbability: boolean;
  probability: number;
  scanDepth: number | null;
  recursiveScan: boolean;
  preventFurtherRecursion: boolean;
  delayUntilRecursion: boolean;
  recursionDelayLevel: number | null;
  ignoreBudget: boolean;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  useGroupScoring: WorldbookTriState;
  sticky: number | null;
  cooldown: number | null;
  delay: number | null;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  matchCharacterDepthPrompt: boolean;
  automationId: string;
  generationTriggersText: string;
  outletName: string;
  characterFilterIsExclude: boolean;
  characterFilterNamesText: string;
  characterFilterTagsText: string;
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
  externalUid: null,
  enabled: true,
  name: "",
  addMemo: true,
  comment: "",
  content: "",
  primaryKeysText: "",
  secondaryKeysText: "",
  conditionLogic: "andAny",
  selective: false,
  constant: false,
  vectorized: false,
  caseSensitive: "inherit",
  matchWholeWords: "inherit",
  insertionPosition: "beforeCharacterDefinition",
  depthRole: "system",
  insertionDepth: 3,
  insertionOrder: 100,
  displayOrder: 0,
  useProbability: true,
  probability: 100,
  scanDepth: null,
  recursiveScan: true,
  preventFurtherRecursion: false,
  delayUntilRecursion: false,
  recursionDelayLevel: null,
  ignoreBudget: false,
  group: "",
  groupOverride: false,
  groupWeight: 100,
  useGroupScoring: "inherit",
  sticky: 0,
  cooldown: 0,
  delay: 0,
  matchPersonaDescription: false,
  matchCharacterDescription: false,
  matchCharacterPersonality: false,
  matchScenario: false,
  matchCreatorNotes: false,
  matchCharacterDepthPrompt: false,
  automationId: "",
  generationTriggersText: "",
  outletName: "",
  characterFilterIsExclude: false,
  characterFilterNamesText: "",
  characterFilterTagsText: "",
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
    externalUid: entry.externalUid,
    enabled: entry.enabled,
    name: entry.name,
    addMemo: entry.addMemo,
    comment: entry.comment,
    content: entry.content,
    primaryKeysText: entry.primaryKeys.join(", "),
    secondaryKeysText: entry.secondaryKeys.join(", "),
    conditionLogic: entry.conditionLogic,
    selective: entry.selective,
    constant: entry.constant,
    vectorized: entry.vectorized,
    caseSensitive: entry.caseSensitive,
    matchWholeWords: entry.matchWholeWords,
    insertionPosition: entry.insertionPosition,
    depthRole: entry.depthRole,
    insertionDepth: entry.insertionDepth,
    insertionOrder: entry.insertionOrder,
    displayOrder: entry.displayOrder,
    useProbability: entry.useProbability,
    probability: entry.probability,
    scanDepth: entry.scanDepth,
    recursiveScan: entry.recursiveScan,
    preventFurtherRecursion: entry.preventFurtherRecursion,
    delayUntilRecursion: entry.delayUntilRecursion,
    recursionDelayLevel: entry.recursionDelayLevel,
    ignoreBudget: entry.ignoreBudget,
    group: entry.group,
    groupOverride: entry.groupOverride,
    groupWeight: entry.groupWeight,
    useGroupScoring: entry.useGroupScoring,
    sticky: entry.sticky,
    cooldown: entry.cooldown,
    delay: entry.delay,
    matchPersonaDescription: entry.matchPersonaDescription,
    matchCharacterDescription: entry.matchCharacterDescription,
    matchCharacterPersonality: entry.matchCharacterPersonality,
    matchScenario: entry.matchScenario,
    matchCreatorNotes: entry.matchCreatorNotes,
    matchCharacterDepthPrompt: entry.matchCharacterDepthPrompt,
    automationId: entry.automationId,
    generationTriggersText: entry.generationTriggers.join(", "),
    outletName: entry.outletName,
    characterFilterIsExclude: entry.characterFilter.isExclude ?? false,
    characterFilterNamesText: (entry.characterFilter.names ?? []).join(", "),
    characterFilterTagsText: (entry.characterFilter.tags ?? []).join(", "),
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
    externalUid: form.externalUid,
    enabled: form.enabled,
    name: form.name.trim(),
    addMemo: form.addMemo,
    comment: form.comment,
    content: form.content,
    primaryKeys: textListFromInput(form.primaryKeysText),
    secondaryKeys: textListFromInput(form.secondaryKeysText),
    conditionLogic: form.conditionLogic,
    selective: form.selective,
    constant: form.constant,
    vectorized: form.vectorized,
    caseSensitive: form.caseSensitive,
    matchWholeWords: form.matchWholeWords,
    insertionPosition: form.insertionPosition,
    depthRole: form.depthRole,
    insertionDepth: form.insertionDepth,
    ...(mode === "update"
      ? {
          insertionOrder: form.insertionOrder,
          displayOrder: form.displayOrder,
        }
      : {}),
    useProbability: form.useProbability,
    probability: form.probability,
    scanDepth: form.scanDepth,
    recursiveScan: form.recursiveScan,
    preventFurtherRecursion: form.preventFurtherRecursion,
    delayUntilRecursion: form.delayUntilRecursion,
    recursionDelayLevel: form.recursionDelayLevel,
    ignoreBudget: form.ignoreBudget,
    group: form.group,
    groupOverride: form.groupOverride,
    groupWeight: form.groupWeight,
    useGroupScoring: form.useGroupScoring,
    sticky: form.sticky,
    cooldown: form.cooldown,
    delay: form.delay,
    matchPersonaDescription: form.matchPersonaDescription,
    matchCharacterDescription: form.matchCharacterDescription,
    matchCharacterPersonality: form.matchCharacterPersonality,
    matchScenario: form.matchScenario,
    matchCreatorNotes: form.matchCreatorNotes,
    matchCharacterDepthPrompt: form.matchCharacterDepthPrompt,
    automationId: form.automationId,
    generationTriggers: textListFromInput(
      form.generationTriggersText,
    ) as WorldbookGenerationTrigger[],
    outletName: form.outletName,
    characterFilter: {
      isExclude: form.characterFilterIsExclude,
      names: textListFromInput(form.characterFilterNamesText),
      tags: textListFromInput(form.characterFilterTagsText),
    },
  };
}

function textListFromInput(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
