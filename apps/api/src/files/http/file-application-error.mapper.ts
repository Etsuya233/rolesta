import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import { ApiFailure } from '../../http/api-failure.js';
import type {
  FileApplicationError,
  FileApplicationErrorReason,
} from '../application/file-application-error.js';

export function toApiFailure(error: FileApplicationError<FileApplicationErrorReason>): ApiFailure {
  switch (error.reason) {
    case 'file-not-found':
      return new ApiFailure({
        status: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
        params: error.params,
      });
    case 'invalid-crop':
    case 'invalid-image':
      return new ApiFailure({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: ERROR_CODES.VALIDATION_FAILED,
        params: error.params,
      });
    case 'unsupported-image':
      return new ApiFailure({
        status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        code: ERROR_CODES.VALIDATION_FAILED,
        params: error.params,
      });
    case 'storage-unavailable':
      return new ApiFailure({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: ERROR_CODES.INTERNAL_ERROR,
        params: error.params,
      });
  }
}
