import { DomainEventHandlingError } from '../../common/events/index.js';
import { CharacterApplicationError } from './character-application-error.js';
import { CHARACTER_AVATAR_CHANGED } from '../events/index.js';
import {
  CharacterPortError,
  type CharacterPortErrorReason,
} from '../ports/character-port-error.js';

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

  if (error instanceof DomainEventHandlingError && error.eventType === CHARACTER_AVATAR_CHANGED) {
    return new CharacterApplicationError({
      reason: 'avatar-assignment-conflict',
      params: { detail: 'Avatar resource state changed concurrently.' },
      cause: error,
    });
  }

  return error;
}
