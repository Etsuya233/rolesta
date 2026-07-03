export interface PageRequest {
  pageIndex: number;
  pageSize: number;
}

export interface PageResponse<TItem> {
  items: TItem[];
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function clampPageIndex(pageIndex: number): number {
  if (!Number.isFinite(pageIndex)) {
    return 0;
  }

  return Math.max(Math.trunc(pageIndex), 0);
}

export function clampPageSize(pageSize: number, defaultPageSize = 20, maxPageSize = 100): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return defaultPageSize;
  }

  return Math.min(Math.trunc(pageSize), maxPageSize);
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(Math.ceil(totalItems / pageSize), 1);
}
