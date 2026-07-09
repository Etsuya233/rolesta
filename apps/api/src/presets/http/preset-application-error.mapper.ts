import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import { ApiFailure } from '../../http/api-failure.js';
import type { PresetApplicationError } from '../application/preset-application-error.js';

export function toApiFailure(error: PresetApplicationError): ApiFailure {
  switch (error.reason) {
    case 'not-found':
      return new ApiFailure({
        status: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
        params: error.params,
      });
    case 'forbidden':
      return new ApiFailure({
        status: HttpStatus.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN,
        params: error.params,
      });
    case 'invalid-import-file':
    case 'invalid-preset':
    case 'duplicate-entry':
    case 'unknown-entry':
      return new ApiFailure({
        status: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_FAILED,
        params: error.params,
      });
  }
}
