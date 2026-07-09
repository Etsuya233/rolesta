import { UseCase } from "../../common/errors/index.js";
import {
  clampPageIndex,
  clampPageSize,
  type PageResponse,
} from "@rolesta/shared";
import type { WorldbookSummary } from "../domain/worldbook.js";
import { translateWorldbookError } from "./worldbook-error.mapper.js";
import type {
  SortDirection,
  WorldbookSortKey,
  WorldbookStore,
} from "../ports/worldbook-store.js";

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

  @UseCase(translateWorldbookError)
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
