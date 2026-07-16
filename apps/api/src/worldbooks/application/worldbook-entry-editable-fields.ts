import { countPromptTokens } from '@rolesta/shared';
import type {
  WorldbookEntryRole,
  WorldbookEntry,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
} from '../domain/worldbook.js';

export interface WorldbookEntryEditableFields {
  enabled?: boolean;
  name?: string;
  comment?: string;
  content?: string;
  primaryKeys?: string[];
  secondaryKeys?: string[];
  selective?: boolean;
  selectiveLogic?: WorldbookSelectiveLogic;
  constant?: boolean;
  vectorized?: boolean;
  ignoreBudget?: boolean;
  useProbability?: boolean;
  caseSensitive?: boolean | null;
  matchWholeWords?: boolean | null;
  matchPersonaDescription?: boolean;
  matchCharacterDescription?: boolean;
  matchCharacterPersonality?: boolean;
  matchCharacterDepthPrompt?: boolean;
  matchScenario?: boolean;
  matchCreatorNotes?: boolean;
  insertionPosition?: WorldbookInsertionPosition;
  insertionOrder?: number;
  depth?: number;
  insertionRole?: WorldbookEntryRole;
  anchorName?: string;
  scanDepth?: number | null;
  excludeRecursion?: boolean;
  preventRecursion?: boolean;
  delayUntilRecursion?: number;
  group?: string;
  groupOverride?: boolean;
  groupWeight?: number;
  useGroupScoring?: boolean | null;
  sticky?: number | null;
  cooldown?: number | null;
  delay?: number | null;
  characterFilterNames?: string[];
  characterFilterTags?: string[];
  characterFilterExclude?: boolean;
  triggers?: WorldbookEntry['triggers'];
  automationId?: string;
  addMemo?: boolean;
  probability?: number;
}

export function applyWorldbookEntryEditableFields(
  entry: WorldbookEntry,
  fields: WorldbookEntryEditableFields,
): WorldbookEntry {
  const content = fields.content ?? entry.content;

  return {
    ...entry,
    enabled: fields.enabled ?? entry.enabled,
    name: fields.name ?? entry.name,
    comment: fields.comment ?? entry.comment,
    content,
    primaryKeys: fields.primaryKeys ?? entry.primaryKeys,
    secondaryKeys: fields.secondaryKeys ?? entry.secondaryKeys,
    selective: fields.selective ?? entry.selective,
    selectiveLogic: fields.selectiveLogic ?? entry.selectiveLogic,
    constant: fields.constant ?? entry.constant,
    vectorized: fields.vectorized ?? entry.vectorized,
    ignoreBudget: fields.ignoreBudget ?? entry.ignoreBudget,
    useProbability: fields.useProbability ?? entry.useProbability,
    caseSensitive: fields.caseSensitive === undefined ? entry.caseSensitive : fields.caseSensitive,
    matchWholeWords:
      fields.matchWholeWords === undefined ? entry.matchWholeWords : fields.matchWholeWords,
    matchPersonaDescription: fields.matchPersonaDescription ?? entry.matchPersonaDescription,
    matchCharacterDescription: fields.matchCharacterDescription ?? entry.matchCharacterDescription,
    matchCharacterPersonality: fields.matchCharacterPersonality ?? entry.matchCharacterPersonality,
    matchCharacterDepthPrompt: fields.matchCharacterDepthPrompt ?? entry.matchCharacterDepthPrompt,
    matchScenario: fields.matchScenario ?? entry.matchScenario,
    matchCreatorNotes: fields.matchCreatorNotes ?? entry.matchCreatorNotes,
    insertionPosition: fields.insertionPosition ?? entry.insertionPosition,
    insertionOrder: fields.insertionOrder ?? entry.insertionOrder,
    depth: fields.depth ?? entry.depth,
    insertionRole: fields.insertionRole ?? entry.insertionRole,
    anchorName: fields.anchorName ?? entry.anchorName,
    scanDepth: fields.scanDepth === undefined ? entry.scanDepth : fields.scanDepth,
    excludeRecursion: fields.excludeRecursion ?? entry.excludeRecursion,
    preventRecursion: fields.preventRecursion ?? entry.preventRecursion,
    delayUntilRecursion: fields.delayUntilRecursion ?? entry.delayUntilRecursion,
    group: fields.group ?? entry.group,
    groupOverride: fields.groupOverride ?? entry.groupOverride,
    groupWeight: fields.groupWeight ?? entry.groupWeight,
    useGroupScoring:
      fields.useGroupScoring === undefined ? entry.useGroupScoring : fields.useGroupScoring,
    sticky: fields.sticky === undefined ? entry.sticky : fields.sticky,
    cooldown: fields.cooldown === undefined ? entry.cooldown : fields.cooldown,
    delay: fields.delay === undefined ? entry.delay : fields.delay,
    characterFilterNames: fields.characterFilterNames ?? entry.characterFilterNames,
    characterFilterTags: fields.characterFilterTags ?? entry.characterFilterTags,
    characterFilterExclude: fields.characterFilterExclude ?? entry.characterFilterExclude,
    triggers: fields.triggers ?? entry.triggers,
    automationId: fields.automationId ?? entry.automationId,
    addMemo: fields.addMemo ?? entry.addMemo,
    probability: fields.probability ?? entry.probability,
    tokenCount: content === entry.content ? entry.tokenCount : countPromptTokens(content),
  };
}
