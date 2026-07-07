import { countPromptTokens } from "@rolesta/shared";
import type {
  WorldbookCharacterFilter,
  WorldbookConditionLogic,
  WorldbookDepthRole,
  WorldbookEntry,
  WorldbookGenerationTrigger,
  WorldbookInsertionPosition,
  WorldbookTriState,
} from "../domain/worldbook.js";

export interface WorldbookEntryEditableFields {
  externalUid?: number | null;
  enabled?: boolean;
  name?: string;
  addMemo?: boolean;
  comment?: string;
  content?: string;
  primaryKeys?: string[];
  secondaryKeys?: string[];
  conditionLogic?: WorldbookConditionLogic;
  selective?: boolean;
  constant?: boolean;
  vectorized?: boolean;
  caseSensitive?: WorldbookTriState;
  matchWholeWords?: WorldbookTriState;
  insertionPosition?: WorldbookInsertionPosition;
  depthRole?: WorldbookDepthRole;
  insertionDepth?: number;
  insertionOrder?: number;
  displayOrder?: number;
  useProbability?: boolean;
  probability?: number;
  scanDepth?: number | null;
  recursiveScan?: boolean;
  preventFurtherRecursion?: boolean;
  delayUntilRecursion?: boolean;
  recursionDelayLevel?: number | null;
  ignoreBudget?: boolean;
  group?: string;
  groupOverride?: boolean;
  groupWeight?: number;
  useGroupScoring?: WorldbookTriState;
  sticky?: number | null;
  cooldown?: number | null;
  delay?: number | null;
  matchPersonaDescription?: boolean;
  matchCharacterDescription?: boolean;
  matchCharacterPersonality?: boolean;
  matchScenario?: boolean;
  matchCreatorNotes?: boolean;
  matchCharacterDepthPrompt?: boolean;
  automationId?: string;
  generationTriggers?: WorldbookGenerationTrigger[];
  outletName?: string;
  characterFilter?: WorldbookCharacterFilter;
}

export function applyWorldbookEntryEditableFields(
  entry: WorldbookEntry,
  fields: WorldbookEntryEditableFields,
): WorldbookEntry {
  const content = fields.content ?? entry.content;

  return {
    ...entry,
    externalUid:
      "externalUid" in fields ? fields.externalUid! : entry.externalUid,
    enabled: fields.enabled ?? entry.enabled,
    name: fields.name ?? entry.name,
    addMemo: fields.addMemo ?? entry.addMemo,
    comment: fields.comment ?? entry.comment,
    content,
    primaryKeys: fields.primaryKeys ?? entry.primaryKeys,
    secondaryKeys: fields.secondaryKeys ?? entry.secondaryKeys,
    conditionLogic: fields.conditionLogic ?? entry.conditionLogic,
    selective: fields.selective ?? entry.selective,
    constant: fields.constant ?? entry.constant,
    vectorized: fields.vectorized ?? entry.vectorized,
    caseSensitive: fields.caseSensitive ?? entry.caseSensitive,
    matchWholeWords: fields.matchWholeWords ?? entry.matchWholeWords,
    insertionPosition: fields.insertionPosition ?? entry.insertionPosition,
    depthRole: fields.depthRole ?? entry.depthRole,
    insertionDepth: fields.insertionDepth ?? entry.insertionDepth,
    insertionOrder: fields.insertionOrder ?? entry.insertionOrder,
    displayOrder: fields.displayOrder ?? entry.displayOrder,
    useProbability: fields.useProbability ?? entry.useProbability,
    probability: fields.probability ?? entry.probability,
    scanDepth: "scanDepth" in fields ? fields.scanDepth! : entry.scanDepth,
    recursiveScan: fields.recursiveScan ?? entry.recursiveScan,
    preventFurtherRecursion:
      fields.preventFurtherRecursion ?? entry.preventFurtherRecursion,
    delayUntilRecursion:
      fields.delayUntilRecursion ?? entry.delayUntilRecursion,
    recursionDelayLevel:
      "recursionDelayLevel" in fields
        ? fields.recursionDelayLevel!
        : entry.recursionDelayLevel,
    ignoreBudget: fields.ignoreBudget ?? entry.ignoreBudget,
    group: fields.group ?? entry.group,
    groupOverride: fields.groupOverride ?? entry.groupOverride,
    groupWeight: fields.groupWeight ?? entry.groupWeight,
    useGroupScoring: fields.useGroupScoring ?? entry.useGroupScoring,
    sticky: "sticky" in fields ? fields.sticky! : entry.sticky,
    cooldown: "cooldown" in fields ? fields.cooldown! : entry.cooldown,
    delay: "delay" in fields ? fields.delay! : entry.delay,
    matchPersonaDescription:
      fields.matchPersonaDescription ?? entry.matchPersonaDescription,
    matchCharacterDescription:
      fields.matchCharacterDescription ?? entry.matchCharacterDescription,
    matchCharacterPersonality:
      fields.matchCharacterPersonality ?? entry.matchCharacterPersonality,
    matchScenario: fields.matchScenario ?? entry.matchScenario,
    matchCreatorNotes: fields.matchCreatorNotes ?? entry.matchCreatorNotes,
    matchCharacterDepthPrompt:
      fields.matchCharacterDepthPrompt ?? entry.matchCharacterDepthPrompt,
    automationId: fields.automationId ?? entry.automationId,
    generationTriggers: fields.generationTriggers ?? entry.generationTriggers,
    outletName: fields.outletName ?? entry.outletName,
    characterFilter: fields.characterFilter ?? entry.characterFilter,
    tokenCount:
      content === entry.content ? entry.tokenCount : countPromptTokens(content),
  };
}
