export interface PageRequest {
  limit: number;
  cursor?: string;
}

export interface PageResponse<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

export function clampPageLimit(limit: number, maxLimit = 100): number {
  if (!Number.isFinite(limit)) {
    return maxLimit;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), maxLimit);
}
