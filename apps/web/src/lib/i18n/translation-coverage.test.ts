import { DEFAULT_ERROR_MESSAGE_KEYS } from '@rolesta/shared';
import { describe, expect, it } from 'vitest';
import { resources } from './resources';

describe('translation resources', () => {
  it('contains translations for every default API error message key', () => {
    for (const resource of Object.values(resources)) {
      for (const messageKey of Object.values(DEFAULT_ERROR_MESSAGE_KEYS)) {
        expect(resource.translation).toHaveProperty(messageKey);
      }
    }
  });
});
