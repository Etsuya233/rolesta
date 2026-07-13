import { ApplicationError } from '../../common/errors/index.js';

export type UserAvatarApplicationErrorReason =
  'not-found' | 'invalid-avatar' | 'avatar-assignment-conflict' | 'avatar-storage-unavailable';

export interface UserAvatarApplicationErrorParamsMap {
  'not-found': { userId: string };
  'invalid-avatar': { field?: string; detail?: string };
  'avatar-assignment-conflict': { detail?: string };
  'avatar-storage-unavailable': { detail?: string };
}

export type UserAvatarApplicationErrorParams<
  R extends UserAvatarApplicationErrorReason = UserAvatarApplicationErrorReason,
> = UserAvatarApplicationErrorParamsMap[R];

export class UserAvatarApplicationError<
  R extends UserAvatarApplicationErrorReason = UserAvatarApplicationErrorReason,
> extends ApplicationError<R, UserAvatarApplicationErrorParams<R>> {
  constructor(options: { reason: R; params: UserAvatarApplicationErrorParams<R>; cause?: unknown }) {
    super(options);
  }
}
