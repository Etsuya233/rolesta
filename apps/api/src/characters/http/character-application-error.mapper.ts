import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import { ApiFailure } from '../../http/api-failure.js';
import type {
  CharacterApplicationError,
  CharacterApplicationErrorReason,
} from '../application/character-application-error.js';

export function toApiFailure(
  error: CharacterApplicationError<CharacterApplicationErrorReason>,
): ApiFailure {
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
    case 'invalid-character-card':
    case 'invalid-import-file':
    case 'unsupported-character-card':
    case 'invalid-avatar':
      return new ApiFailure({
        status: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_FAILED,
        params: error.params,
      });
    case 'avatar-storage-unavailable':
      return new ApiFailure({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: ERROR_CODES.INTERNAL_ERROR,
        params: error.params,
      });
  }
}
