import { describe, expect, it } from 'vitest';
import { clampPageIndex, clampPageSize, getTotalPages } from './pagination.js';

describe('offset pagination helpers', () => {
  it('normalizes page index and page size', () => {
    expect(clampPageIndex(-1)).toBe(0);
    expect(clampPageIndex(2.8)).toBe(2);
    expect(clampPageSize(0)).toBe(20);
    expect(clampPageSize(500)).toBe(100);
  });

  it('calculates total pages with at least one page', () => {
    expect(getTotalPages(0, 20)).toBe(1);
    expect(getTotalPages(1, 20)).toBe(1);
    expect(getTotalPages(21, 20)).toBe(2);
  });
});
