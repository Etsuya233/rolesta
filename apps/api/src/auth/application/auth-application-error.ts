import { ApplicationError } from '../../common/errors/index.js';

export type AuthApplicationErrorReason =
  | 'invalid-username'
  | 'invalid-credentials'
  | 'setup-already-completed'
  | 'unauthenticated'
  | 'internal-error';

export interface AuthApplicationErrorParamsMap {
  'invalid-username': {
    field: 'username';
  };
  'invalid-credentials': {
    operation: 'login';
  };
  'setup-already-completed': {
    operation: 'setup-admin';
  };
  unauthenticated: {
    source: 'bearer-token';
  };
  'internal-error': {
    component: string;
    operation: string;
  };
}

export type AuthApplicationErrorParams<
  R extends AuthApplicationErrorReason = AuthApplicationErrorReason,
> = AuthApplicationErrorParamsMap[R];

export interface AuthApplicationErrorOptions<R extends AuthApplicationErrorReason> {
  reason: R;
  params: AuthApplicationErrorParams<R>;
  cause?: unknown;
}

export class AuthApplicationError<
  R extends AuthApplicationErrorReason = AuthApplicationErrorReason,
> extends ApplicationError<R, AuthApplicationErrorParams<R>> {
  constructor(options: AuthApplicationErrorOptions<R>) {
    super(options);
  }
}
