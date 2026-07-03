import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import { ApiFailure } from '../../http/api-failure.js';
import type { AuthApplicationError } from '../application/auth-application-error.js';

export function toApiFailure(error: AuthApplicationError): ApiFailure {
  switch (error.kind) {
    case 'invalid-username':
      return new ApiFailure({
        status: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    case 'setup-already-completed':
      return new ApiFailure({
        status: HttpStatus.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN,
      });
    case 'invalid-credentials':
    case 'unauthenticated':
      return new ApiFailure({
        status: HttpStatus.UNAUTHORIZED,
        code: ERROR_CODES.UNAUTHENTICATED,
      });
  }
}
