import { ApplicationError } from '../../common/errors/index.js';

export type PresetApplicationErrorReason =
  | 'not-found'
  | 'forbidden'
  | 'invalid-import-file'
  | 'invalid-preset'
  | 'model-provider-unavailable'
  | 'duplicate-entry'
  | 'unknown-entry';

export interface PresetApplicationErrorParamsMap {
  'not-found': {
    presetId: string;
  };
  forbidden: {
    presetId: string;
    viewerUserId: string;
  };
  'invalid-import-file': {
    fileName?: string;
    field?: string;
  };
  'invalid-preset': {
    fileName?: string;
    field?: string;
  };
  'model-provider-unavailable': {
    modelProviderId: string;
  };
  'duplicate-entry': {
    presetId: string;
    entryId: string;
  };
  'unknown-entry': {
    presetId: string;
    entryId?: string;
    identifier?: string;
  };
}

export type PresetApplicationErrorParams<
  R extends PresetApplicationErrorReason = PresetApplicationErrorReason,
> = PresetApplicationErrorParamsMap[R];

export interface PresetApplicationErrorOptions<
  R extends PresetApplicationErrorReason,
> {
  reason: R;
  params: PresetApplicationErrorParams<R>;
  cause?: unknown;
}

export class PresetApplicationError<
  R extends PresetApplicationErrorReason = PresetApplicationErrorReason,
> extends ApplicationError<R, PresetApplicationErrorParams<R>> {
  constructor(options: PresetApplicationErrorOptions<R>) {
    super(options);
  }
}
