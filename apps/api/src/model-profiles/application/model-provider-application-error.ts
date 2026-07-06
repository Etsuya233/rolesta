export type ModelProviderApplicationErrorReason =
  | 'invalid-provider'
  | 'invalid-base-url'
  | 'api-key-not-owned'
  | 'model-name-required'
  | 'remote-auth-failed'
  | 'remote-model-not-found'
  | 'remote-unreachable'
  | 'remote-error'
  | 'remote-response-invalid'
  | 'not-found';

export class ModelProviderApplicationError extends Error {
  constructor(readonly reason: ModelProviderApplicationErrorReason) {
    super(reason);
    this.name = 'ModelProviderApplicationError';
  }
}
