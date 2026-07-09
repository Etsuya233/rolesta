import { PortError } from '../../common/errors/index.js';

export type PresetPortErrorReason = 'invalid-import-file' | 'invalid-preset';

export interface PresetPortErrorParamsMap {
  'invalid-import-file': {
    fileName?: string;
    field?: string;
  };
  'invalid-preset': {
    fileName?: string;
    field?: string;
  };
}

export type PresetPortErrorParams<R extends PresetPortErrorReason = PresetPortErrorReason> =
  PresetPortErrorParamsMap[R];

export interface PresetPortErrorOptions<R extends PresetPortErrorReason> {
  reason: R;
  params: PresetPortErrorParams<R>;
  cause?: unknown;
}

export class PresetPortError<
  R extends PresetPortErrorReason = PresetPortErrorReason,
> extends PortError<R, PresetPortErrorParams<R>> {
  constructor(options: PresetPortErrorOptions<R>) {
    super(options);
  }
}
