import { I18N_MESSAGE_PREFIX } from '@rolesta/shared';
import { describe, expect, it } from 'vitest';
import { changeLocale } from './i18n';
import { formatApiMessage } from './api-error-message';

describe('formatApiMessage', () => {
  it('translates marked i18n keys with params', async () => {
    await changeLocale('en-US');

    expect(formatApiMessage(`${I18N_MESSAGE_PREFIX}errors.passwordTooShort`, { min: 8 })).toBe(
      'Password must be at least 8 characters.',
    );
  });

  it('displays plain messages directly', () => {
    expect(formatApiMessage('Plain backend message', {})).toBe('Plain backend message');
  });

  it('keeps the original marked message when the key is missing', () => {
    expect(formatApiMessage(`${I18N_MESSAGE_PREFIX}errors.missingKey`, {})).toBe(
      `${I18N_MESSAGE_PREFIX}errors.missingKey`,
    );
  });
});
