import { PortError } from '../../common/errors/index.js';

export type AuthPortErrorReason =
  | 'user-account-store-failed'
  | 'session-store-failed'
  | 'session-token-issuer-failed'
  | 'password-hashing-failed';

export interface AuthPortErrorParamsMap {
  'user-account-store-failed': {
    operation: 'count' | 'findById' | 'findByUsername' | 'save';
  };
  'session-store-failed': {
    operation: 'save' | 'findByTokenHash' | 'deleteByTokenHash' | 'deleteExpired';
  };
  'session-token-issuer-failed': {
    operation: 'issue' | 'hash';
  };
  'password-hashing-failed': {
    operation: 'hash' | 'verify';
  };
}

export type AuthPortErrorParams<R extends AuthPortErrorReason = AuthPortErrorReason> =
  AuthPortErrorParamsMap[R];

export interface AuthPortErrorOptions<R extends AuthPortErrorReason> {
  reason: R;
  params: AuthPortErrorParams<R>;
  cause?: unknown;
}

export class AuthPortError<R extends AuthPortErrorReason = AuthPortErrorReason> extends PortError<
  R,
  AuthPortErrorParams<R>
> {
  constructor(options: AuthPortErrorOptions<R>) {
    super(options);
  }
}
