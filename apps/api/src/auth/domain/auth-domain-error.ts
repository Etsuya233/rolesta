import { DomainError } from '../../common/errors/index.js';

export type AuthDomainErrorReason = 'invalid-username';

export interface AuthDomainErrorParamsMap {
  'invalid-username': {
    field: 'username';
  };
}

export type AuthDomainErrorParams<R extends AuthDomainErrorReason = AuthDomainErrorReason> =
  AuthDomainErrorParamsMap[R];

export interface AuthDomainErrorOptions<R extends AuthDomainErrorReason> {
  reason: R;
  params: AuthDomainErrorParams<R>;
  cause?: unknown;
}

export class AuthDomainError<
  R extends AuthDomainErrorReason = AuthDomainErrorReason,
> extends DomainError<R, AuthDomainErrorParams<R>> {
  constructor(options: AuthDomainErrorOptions<R>) {
    super(options);
  }
}
