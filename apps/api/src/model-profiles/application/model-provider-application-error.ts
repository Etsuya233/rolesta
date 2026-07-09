import { ApplicationError } from '../../common/errors/index.js';
import type { ModelProviderDomainErrorParams } from '../domain/model-provider-domain-error.js';
import type { ModelProviderPortErrorParams } from '../ports/model-provider-port-error.js';

export type ModelProviderApplicationErrorReason =
  | 'not-found'
  | 'api-key-not-owned'
  | 'model-name-required'
  | 'invalid-provider'
  | 'invalid-base-url'
  | 'remote-auth-failed'
  | 'remote-model-not-found'
  | 'remote-unreachable'
  | 'remote-error'
  | 'remote-response-invalid';

export interface ModelProviderApplicationErrorParamsMap {
  'not-found': Record<string, never>;
  'api-key-not-owned': Record<string, never>;
  'model-name-required': Record<string, never>;
  'invalid-provider': ModelProviderDomainErrorParams<'invalid-provider'>;
  'invalid-base-url': ModelProviderDomainErrorParams<'invalid-base-url'>;
  'remote-auth-failed': ModelProviderPortErrorParams<'remote-auth-failed'>;
  'remote-model-not-found': ModelProviderPortErrorParams<'remote-model-not-found'>;
  'remote-unreachable': ModelProviderPortErrorParams<'remote-unreachable'>;
  'remote-error': ModelProviderPortErrorParams<'remote-error'>;
  'remote-response-invalid': ModelProviderPortErrorParams<'remote-response-invalid'>;
}

export type ModelProviderApplicationErrorParams<
  R extends ModelProviderApplicationErrorReason = ModelProviderApplicationErrorReason,
> = ModelProviderApplicationErrorParamsMap[R];

export class ModelProviderApplicationError<
  R extends ModelProviderApplicationErrorReason = ModelProviderApplicationErrorReason,
> extends ApplicationError<R, ModelProviderApplicationErrorParams<R>> {
  constructor(
    reason: R,
    params: ModelProviderApplicationErrorParams<R>,
    cause?: unknown,
  ) {
    super({ reason, params, cause });
  }
}
