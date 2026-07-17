import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import { ApiFailure } from '../../http/api-failure.js';
import type { ModelProviderApplicationError } from '../application/model-provider-application-error.js';

export function toApiFailure(error: ModelProviderApplicationError): ApiFailure {
  switch (error.reason) {
    case 'not-found':
      return new ApiFailure({
        status: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
        reason: error.reason,
        messageKey: 'modelProviders.errors.notFound',
        params: error.params,
        cause: error,
      });
    case 'invalid-provider':
    case 'invalid-base-url':
    case 'api-key-not-owned':
    case 'model-name-required':
    case 'remote-auth-failed':
    case 'remote-model-not-found':
    case 'remote-unreachable':
    case 'remote-error':
    case 'remote-response-invalid':
      return new ApiFailure({
        status: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_FAILED,
        reason: error.reason,
        messageKey: `modelProviders.errors.${error.reason}`,
        params: error.params,
        cause: error,
      });
  }
}
