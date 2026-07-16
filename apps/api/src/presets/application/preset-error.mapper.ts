import { PresetApplicationError } from './preset-application-error.js';
import { PresetPortError, type PresetPortErrorReason } from '../ports/preset-port-error.js';
import { PresetDomainError } from '../domain/preset-domain-error.js';

export function translatePresetError(error: unknown): unknown {
  if (error instanceof PresetApplicationError) {
    return error;
  }

  if (error instanceof PresetPortError) {
    const portError = error as PresetPortError<PresetPortErrorReason>;

    return new PresetApplicationError({
      reason: portError.reason,
      params: portError.params,
      cause: portError,
    });
  }

  if (error instanceof PresetDomainError) {
    return new PresetApplicationError({
      reason: 'invalid-preset',
      params: { field: error.params.field },
      cause: error,
    });
  }

  return error;
}
