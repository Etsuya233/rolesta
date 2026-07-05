export type PresetApplicationErrorReason =
  | 'not-found'
  | 'forbidden'
  | 'invalid-import-file'
  | 'invalid-preset'
  | 'duplicate-entry'
  | 'unknown-entry';

export class PresetApplicationError extends Error {
  constructor(readonly reason: PresetApplicationErrorReason) {
    super(reason);
    this.name = 'PresetApplicationError';
  }
}
