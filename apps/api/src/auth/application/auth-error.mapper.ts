import { AuthApplicationError } from './auth-application-error.js';
import { AuthDomainError, type AuthDomainErrorReason } from '../domain/auth-domain-error.js';
import { AuthPortError, type AuthPortErrorReason } from '../ports/auth-port-error.js';

export function translateAuthError(error: unknown): unknown {
  if (error instanceof AuthApplicationError) {
    return error;
  }

  if (error instanceof AuthDomainError) {
    const domainError = error as AuthDomainError<AuthDomainErrorReason>;

    return new AuthApplicationError({
      reason: domainError.reason,
      params: domainError.params,
      cause: domainError,
    });
  }

  if (error instanceof AuthPortError) {
    const portError = error as AuthPortError<AuthPortErrorReason>;

    return new AuthApplicationError({
      reason: 'internal-error',
      params: {
        component: portError.reason.replace('-failed', ''),
        operation: portError.params.operation,
      },
      cause: portError,
    });
  }

  return error;
}
