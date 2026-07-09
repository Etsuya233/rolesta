import { ModelProviderApplicationError } from './model-provider-application-error.js';
import { ModelProviderDomainError } from '../domain/model-provider-domain-error.js';
import { ModelProviderPortError } from '../ports/model-provider-port-error.js';

export function translateModelProviderError(error: unknown): unknown {
  if (error instanceof ModelProviderApplicationError) {
    return error;
  }

  if (error instanceof ModelProviderDomainError) {
    return new ModelProviderApplicationError(error.reason, error.params, error);
  }

  if (error instanceof ModelProviderPortError) {
    return new ModelProviderApplicationError(error.reason, error.params, error);
  }

  return error;
}
