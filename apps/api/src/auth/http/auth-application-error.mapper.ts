import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import { ApiFailure } from '../../http/api-failure.js';
import type { AuthApplicationError } from '../application/auth-application-error.js';

export function toApiFailure(error: AuthApplicationError): ApiFailure {
  switch (error.reason) {
    case 'invalid-username':
      return new ApiFailure({
        status: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_FAILED,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
    case 'setup-already-completed':
      return new ApiFailure({
        status: HttpStatus.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
    case 'invalid-credentials':
    case 'unauthenticated':
      return new ApiFailure({
        status: HttpStatus.UNAUTHORIZED,
        code: ERROR_CODES.UNAUTHENTICATED,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
    case 'internal-error':
      return new ApiFailure({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ERROR_CODES.INTERNAL_ERROR,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
  }
}
