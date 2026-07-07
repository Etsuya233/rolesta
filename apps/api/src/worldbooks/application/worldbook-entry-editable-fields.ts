import { countPromptTokens } from "@rolesta/shared";
import type {
  WorldbookEntry,
  WorldbookInsertionPosition,
} from "../domain/worldbook.js";

export interface WorldbookEntryEditableFields {
  enabled?: boolean;
  name?: string;
  comment?: string;
  content?: string;
  primaryKeys?: string[];
  secondaryKeys?: string[];
  selective?: boolean;
  constant?: boolean;
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  insertionPosition?: WorldbookInsertionPosition;
  insertionOrder?: number;
  depth?: number;
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
    constant: fields.constant ?? entry.constant,
    caseSensitive: fields.caseSensitive ?? entry.caseSensitive,
    matchWholeWords: fields.matchWholeWords ?? entry.matchWholeWords,
    insertionPosition: fields.insertionPosition ?? entry.insertionPosition,
    insertionOrder: fields.insertionOrder ?? entry.insertionOrder,
    depth: fields.depth ?? entry.depth,
    probability: fields.probability ?? entry.probability,
    tokenCount:
      content === entry.content ? entry.tokenCount : countPromptTokens(content),
  };
}
