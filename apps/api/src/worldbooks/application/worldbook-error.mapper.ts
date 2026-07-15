import {
  WorldbookPortError,
  type WorldbookPortErrorReason,
} from '../ports/worldbook-port-error.js';
import { WorldbookApplicationError } from './worldbook-application-error.js';

export function translateWorldbookError(error: unknown): unknown {
  if (error instanceof WorldbookApplicationError) {
    return error;
  }

  if (error instanceof WorldbookPortError) {
    const portError = error as WorldbookPortError<WorldbookPortErrorReason>;

    return new WorldbookApplicationError({
      reason: portError.reason,
      params: portError.params,
      cause: portError,
    });
  }

  return error;
}
