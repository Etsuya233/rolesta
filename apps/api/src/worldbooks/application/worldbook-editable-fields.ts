import type { Worldbook, WorldbookVisibility } from "../domain/worldbook.js";

export interface WorldbookEditableFields {
  visibility?: WorldbookVisibility;
  name?: string;
  description?: string;
  tags?: string[];
  scanDepth?: number;
  tokenBudget?: number;
  recursiveScan?: boolean;
}

export function applyWorldbookEditableFields(
  worldbook: Worldbook,
  fields: WorldbookEditableFields,
): Worldbook {
  return {
    ...worldbook,
    visibility: fields.visibility ?? worldbook.visibility,
    name: fields.name ?? worldbook.name,
    description: fields.description ?? worldbook.description,
    tags: fields.tags ?? worldbook.tags,
    scanDepth: fields.scanDepth ?? worldbook.scanDepth,
    tokenBudget: fields.tokenBudget ?? worldbook.tokenBudget,
    recursiveScan: fields.recursiveScan ?? worldbook.recursiveScan,
  };
}
