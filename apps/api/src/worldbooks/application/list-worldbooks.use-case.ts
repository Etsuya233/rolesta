import {
  clampPageIndex,
  clampPageSize,
  type PageResponse,
} from "@rolesta/shared";
import type { WorldbookSummary } from "../domain/worldbook.js";
import type {
  SortDirection,
  WorldbookSortKey,
  WorldbookStore,
} from "./worldbook-store.js";

export interface ListWorldbooksCommand {
  viewerUserId: string;
  sort?: WorldbookSortKey;
  direction?: SortDirection;
  pageIndex?: number;
  pageSize?: number;
  q?: string;
}

export class ListWorldbooksUseCase {
  constructor(private readonly store: WorldbookStore) {}

  execute(
    command: ListWorldbooksCommand,
  ): Promise<PageResponse<WorldbookSummary>> {
    return this.store.list({
      viewerUserId: command.viewerUserId,
      sort: command.sort ?? "updatedAt",
      direction: command.direction ?? "desc",
      pageIndex: clampPageIndex(command.pageIndex ?? 0),
      pageSize: clampPageSize(command.pageSize ?? 20),
      q: command.q ?? "",
    });
  }
}
