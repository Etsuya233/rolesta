import { PortError } from '../../common/errors/index.js';

export type UserAvatarPortErrorReason =
  'invalid-avatar' | 'avatar-assignment-conflict' | 'avatar-storage-unavailable';

export interface UserAvatarPortErrorParamsMap {
  'invalid-avatar': { field?: string; detail?: string };
  'avatar-assignment-conflict': { detail?: string };
  'avatar-storage-unavailable': { detail?: string };
}

export type UserAvatarPortErrorParams<
  R extends UserAvatarPortErrorReason = UserAvatarPortErrorReason,
> = UserAvatarPortErrorParamsMap[R];

export class UserAvatarPortError<
  R extends UserAvatarPortErrorReason = UserAvatarPortErrorReason,
> extends PortError<R, UserAvatarPortErrorParams<R>> {
  constructor(options: { reason: R; params: UserAvatarPortErrorParams<R>; cause?: unknown }) {
    super(options);
  }
}
