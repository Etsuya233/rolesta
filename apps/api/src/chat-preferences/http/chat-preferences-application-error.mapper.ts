import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import { ApiFailure } from '../../http/api-failure.js';
import type {
  ChatPreferencesApplicationError,
  ChatPreferencesApplicationErrorReason,
} from '../application/chat-preferences-application-error.js';

export function toApiFailure(
  error: ChatPreferencesApplicationError<ChatPreferencesApplicationErrorReason>,
): ApiFailure {
  switch (error.reason) {
    case 'invalid-patch':
      return new ApiFailure({
        status: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_FAILED,
        reason: error.reason,
        params: error.params,
        cause: error,
      });
    case 'asset-unavailable':
      return new ApiFailure({
        status: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
        reason: error.reason,
        messageKey: 'errors.assetUnavailable',
        params: error.params,
        cause: error,
      });
    case 'asset-defaults-conflict':
      return new ApiFailure({
        status: HttpStatus.CONFLICT,
        code: ERROR_CODES.VALIDATION_FAILED,
        reason: error.reason,
        messageKey: 'errors.assetDefaultsConflict',
        params: error.params,
        cause: error,
      });
  }
}
