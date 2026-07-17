import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import { ApiFailure } from '../../http/api-failure.js';
import type {
  UserAvatarApplicationError,
  UserAvatarApplicationErrorReason,
} from '../application/user-avatar-application-error.js';

export function toApiFailure(
  error: UserAvatarApplicationError<UserAvatarApplicationErrorReason>,
): ApiFailure {
  switch (error.reason) {
    case 'not-found':
      return new ApiFailure({
        status: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
    case 'invalid-avatar':
      return new ApiFailure({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: ERROR_CODES.VALIDATION_FAILED,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
    case 'avatar-assignment-conflict':
      return new ApiFailure({
        status: HttpStatus.CONFLICT,
        code: ERROR_CODES.VALIDATION_FAILED,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
    case 'avatar-storage-unavailable':
      return new ApiFailure({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: ERROR_CODES.INTERNAL_ERROR,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
  }
}
