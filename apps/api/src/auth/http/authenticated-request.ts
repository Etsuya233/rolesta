import type { Request } from 'express';
import type { CurrentUserResult } from '../application/auth-results.js';

export type AuthenticatedRequest = Request & {
  authUser: CurrentUserResult;
};
