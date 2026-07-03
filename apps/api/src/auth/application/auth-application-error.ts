export type AuthApplicationErrorKind =
  | 'invalid-username'
  | 'invalid-credentials'
  | 'setup-already-completed'
  | 'unauthenticated';

export class AuthApplicationError extends Error {
  constructor(readonly kind: AuthApplicationErrorKind) {
    super(kind);
    this.name = 'AuthApplicationError';
  }
}
