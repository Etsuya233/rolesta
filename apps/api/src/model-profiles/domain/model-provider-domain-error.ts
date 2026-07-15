import { DomainError } from '../../common/errors/index.js';

export type ModelProviderDomainErrorReason = 'invalid-provider' | 'invalid-base-url';

export interface ModelProviderDomainErrorParamsMap {
  'invalid-provider': {
    providerKind?: string;
  };
  'invalid-base-url': {
    providerKind?: string;
    baseUrl?: string;
  };
}

export type ModelProviderDomainErrorParams<
  R extends ModelProviderDomainErrorReason = ModelProviderDomainErrorReason,
> = ModelProviderDomainErrorParamsMap[R];

export class ModelProviderDomainError<
  R extends ModelProviderDomainErrorReason = ModelProviderDomainErrorReason,
> extends DomainError<R, ModelProviderDomainErrorParams<R>> {
  constructor(reason: R, params: ModelProviderDomainErrorParams<R>, cause?: unknown) {
    super({ reason, params, cause });
  }
}
