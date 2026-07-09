import { describe, expect, it } from 'vitest';
import { createEmptyCharacterCardDraft } from './character-card.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';

describe('character card domain', () => {
  it('rejects epoch millis values outside safe integer storage', () => {
    expect(() => ensureEpochMillis(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      'Epoch millis must be a non-negative safe integer.',
    );
    expect(() => ensureEpochMillis(-1)).toThrow('Epoch millis must be a non-negative safe integer.');
  });

  it('creates an empty private draft with caller-provided timestamps', () => {
    const card = createEmptyCharacterCardDraft({
      id: 'card_1',
      ownerUserId: 'user_1',
      nowMs: 1783090000000,
    });

    expect(card).toMatchObject({
      id: 'card_1',
      ownerUserId: 'user_1',
      visibility: 'private',
      name: '',
      tags: [],
      version: '',
      usageCount: 0,
      createdAtMs: 1783090000000,
      updatedAtMs: 1783090000000,
    });
  });
});
