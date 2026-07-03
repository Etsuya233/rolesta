import type { UserRole } from '../domain/user-account.js';

export type CurrentUserResult = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
};

export type AuthenticatedUserResult = {
  token: string;
  user: CurrentUserResult;
};

export type SetupStatusResult = {
  requiresSetup: boolean;
};
