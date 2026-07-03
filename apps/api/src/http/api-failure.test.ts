import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, I18N_MESSAGE_PREFIX } from '@rolesta/shared';
import { describe, expect, it } from 'vitest';
import { ApiFailure } from './api-failure.js';

describe('ApiFailure', () => {
  it('uses the default message key for the error code', () => {
    const failure = new ApiFailure({
      status: HttpStatus.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_FAILED,
    });

    expect(failure.message).toBe(`${I18N_MESSAGE_PREFIX}errors.validationFailed`);
    expect(failure.code).toBe(ERROR_CODES.VALIDATION_FAILED);
    expect(failure.messageKey).toBe('errors.validationFailed');
    expect(failure.params).toEqual({});
    expect(failure.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('keeps an explicit business message key and params', () => {
    const failure = new ApiFailure({
      status: HttpStatus.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_FAILED,
      messageKey: 'errors.passwordTooShort',
      params: { min: 8 },
    });

    expect(failure.message).toBe(`${I18N_MESSAGE_PREFIX}errors.passwordTooShort`);
    expect(failure.params).toEqual({ min: 8 });
  });
});
