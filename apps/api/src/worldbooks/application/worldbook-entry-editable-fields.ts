import { countPromptTokens } from "@rolesta/shared";
import type {
  WorldbookEntryRole,
  WorldbookEntry,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
} from "../domain/worldbook.js";

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
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  insertionPosition?: WorldbookInsertionPosition;
  insertionOrder?: number;
  depth?: number;
  insertionRole?: WorldbookEntryRole;
  anchorName?: string;
  scanDepth?: number | null;
  excludeRecursion?: boolean;
  preventRecursion?: boolean;
  delayUntilRecursion?: boolean;
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
    caseSensitive: fields.caseSensitive ?? entry.caseSensitive,
    matchWholeWords: fields.matchWholeWords ?? entry.matchWholeWords,
    insertionPosition: fields.insertionPosition ?? entry.insertionPosition,
    insertionOrder: fields.insertionOrder ?? entry.insertionOrder,
    depth: fields.depth ?? entry.depth,
    insertionRole: fields.insertionRole ?? entry.insertionRole,
    anchorName: fields.anchorName ?? entry.anchorName,
    scanDepth:
      fields.scanDepth === undefined ? entry.scanDepth : fields.scanDepth,
    excludeRecursion: fields.excludeRecursion ?? entry.excludeRecursion,
    preventRecursion: fields.preventRecursion ?? entry.preventRecursion,
    delayUntilRecursion:
      fields.delayUntilRecursion ?? entry.delayUntilRecursion,
    probability: fields.probability ?? entry.probability,
    tokenCount:
      content === entry.content ? entry.tokenCount : countPromptTokens(content),
  };
}
