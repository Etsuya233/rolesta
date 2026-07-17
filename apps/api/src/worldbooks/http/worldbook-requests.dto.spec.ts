import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { WorldbookDocumentEntryDto } from './worldbook-requests.dto.js';

describe('WorldbookDocumentEntryDto', () => {
  it('requires nullable scan fields while accepting explicit null', async () => {
    const missing = await validate(plainToInstance(WorldbookDocumentEntryDto, {}));
    const explicitNull = await validate(
      plainToInstance(WorldbookDocumentEntryDto, {
        scanDepth: null,
        useGroupScoring: null,
        sticky: null,
        cooldown: null,
        delay: null,
      }),
    );

    expect(missing.map((error) => error.property)).toEqual(
      expect.arrayContaining(['scanDepth', 'useGroupScoring', 'sticky', 'cooldown', 'delay']),
    );
    expect(explicitNull.map((error) => error.property)).not.toEqual(
      expect.arrayContaining(['scanDepth', 'useGroupScoring', 'sticky', 'cooldown', 'delay']),
    );
  });
});
