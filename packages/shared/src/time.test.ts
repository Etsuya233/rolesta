import { describe, expect, it } from 'vitest';
import { createIsoTimestamp, isIsoTimestamp } from './time.js';

describe('time helpers', () => {
  it('creates an ISO timestamp string', () => {
    const timestamp = createIsoTimestamp(new Date('2026-06-30T12:00:00.000Z'));

    expect(timestamp).toBe('2026-06-30T12:00:00.000Z');
  });

  it('detects invalid timestamp values', () => {
    expect(isIsoTimestamp('2026-06-30T12:00:00.000Z')).toBe(true);
    expect(isIsoTimestamp('2026-06-30 12:00:00')).toBe(false);
    expect(isIsoTimestamp('')).toBe(false);
  });
});
