import { CharacterApplicationError } from './character-application-error.js';
import { CharacterPortError, type CharacterPortErrorReason } from '../ports/character-port-error.js';

export function translateCharacterError(error: unknown): unknown {
  if (error instanceof CharacterApplicationError) {
    return error;
  }

  if (error instanceof CharacterPortError) {
    const portError = error as CharacterPortError<CharacterPortErrorReason>;

    return new CharacterApplicationError({
      reason: portError.reason,
      params: portError.params,
      cause: portError,
    });
  }

  return error;
}
