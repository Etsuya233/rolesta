import type { PageResponse } from "@rolesta/shared";
import type { Worldbook, WorldbookSummary } from "../domain/worldbook.js";

export const WORLDBOOK_STORE = Symbol("WorldbookStore");

export const WORLDBOOK_SORT_KEYS = [
  "createdAt",
  "updatedAt",
  "name",
  "lastUsedAt",
  "usageCount",
] as const;
export type WorldbookSortKey = (typeof WORLDBOOK_SORT_KEYS)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const WORLDBOOK_LIST_SCOPES = ["all", "mine", "public"] as const;
export type WorldbookListScope = (typeof WORLDBOOK_LIST_SCOPES)[number];

export interface ListWorldbooksRequest {
  viewerUserId: string;
  scope: WorldbookListScope;
  sort: WorldbookSortKey;
  direction: SortDirection;
  pageIndex: number;
  pageSize: number;
  q: string;
}

export interface WorldbookStore {
  list(request: ListWorldbooksRequest): Promise<PageResponse<WorldbookSummary>>;
  findVisibleById(id: string, viewerUserId: string): Promise<Worldbook | null>;
  findOwnedById(id: string, ownerUserId: string): Promise<Worldbook | null>;
  save(worldbook: Worldbook): Promise<void>;
  update(worldbook: Worldbook): Promise<void>;
  deleteOwned(id: string, ownerUserId: string): Promise<boolean>;
}
