import { PortError } from '../../common/errors/index.js';

export type ModelProviderPortErrorReason =
  | 'remote-auth-failed'
  | 'remote-model-not-found'
  | 'remote-unreachable'
  | 'remote-error'
  | 'remote-response-invalid';

export interface ModelProviderPortErrorParamsMap {
  'remote-auth-failed': {
    status?: number;
  };
  'remote-model-not-found': {
    status?: number;
  };
  'remote-unreachable': {
    operation?: string;
    endpoint?: string;
  };
  'remote-error': {
    status?: number;
  };
  'remote-response-invalid': {
    operation?: string;
    invalidReason?: string;
  };
}

export type ModelProviderPortErrorParams<
  R extends ModelProviderPortErrorReason = ModelProviderPortErrorReason,
> = ModelProviderPortErrorParamsMap[R];

export class ModelProviderPortError<
  R extends ModelProviderPortErrorReason = ModelProviderPortErrorReason,
> extends PortError<R, ModelProviderPortErrorParams<R>> {
  constructor(reason: R, params: ModelProviderPortErrorParams<R>, cause?: unknown) {
    super({ reason, params, cause });
  }
}
