import { FilePortError } from '../ports/file-port-error.js';
import { FileApplicationError } from './file-application-error.js';

export function toFileApplicationError(error: unknown): FileApplicationError {
  if (error instanceof FileApplicationError) {
    return error as FileApplicationError;
  }

  if (!(error instanceof FilePortError)) throw error;

  switch (error.reason) {
    case 'invalid-image':
      return new FileApplicationError({ reason: 'invalid-image', params: error.params, cause: error });
    case 'unsupported-image':
      return new FileApplicationError({
        reason: 'unsupported-image',
        params: error.params,
        cause: error,
      });
    case 'content-conflict':
    case 'content-unavailable':
    case 'resource-state-conflict':
      return new FileApplicationError({ reason: 'storage-unavailable', params: error.params, cause: error });
  }
}
