import {
  UserAvatarPortError,
  type UserAvatarPortErrorReason,
} from '../ports/user-avatar-port-error.js';
import { UserAvatarApplicationError } from './user-avatar-application-error.js';

export function translateUserAvatarError(error: unknown): unknown {
  if (error instanceof UserAvatarApplicationError) {
    return error;
  }

  if (error instanceof UserAvatarPortError) {
    const portError = error as UserAvatarPortError<UserAvatarPortErrorReason>;
    return new UserAvatarApplicationError({
      reason: portError.reason,
      params: portError.params,
      cause: portError,
    });
  }

  return error;
}
