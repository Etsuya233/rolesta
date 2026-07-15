import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { validationIssuesFromZodError } from './validation.js';

describe('validation issues', () => {
  it('maps paths and expands unknown keys without exposing input or messages', () => {
    const schema = z.strictObject({
      items: z.array(z.object({ name: z.string() })),
    });
    const result = schema.safeParse({ items: [{ name: 1 }], secret: 'hidden' });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(validationIssuesFromZodError(result.error)).toEqual([
      { field: 'items.0.name', rule: 'invalidType' },
      { field: 'secret', rule: 'unknownField' },
    ]);
  });
});
