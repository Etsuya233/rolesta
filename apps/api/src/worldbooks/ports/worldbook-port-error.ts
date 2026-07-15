import { PortError } from '../../common/errors/index.js';

export type WorldbookPortErrorReason = 'invalid-import-file' | 'invalid-worldbook';

export interface WorldbookPortErrorParamsMap {
  'invalid-import-file': {
    fileName?: string;
    field?: string;
    detail?: string;
  };
  'invalid-worldbook': {
    fileName?: string;
    field?: string;
    value?: string;
    detail?: string;
  };
}

export type WorldbookPortErrorParams<
  R extends WorldbookPortErrorReason = WorldbookPortErrorReason,
> = WorldbookPortErrorParamsMap[R];

export interface WorldbookPortErrorOptions<R extends WorldbookPortErrorReason> {
  reason: R;
  params: WorldbookPortErrorParams<R>;
  cause?: unknown;
}

export class WorldbookPortError<
  R extends WorldbookPortErrorReason = WorldbookPortErrorReason,
> extends PortError<R, WorldbookPortErrorParams<R>> {
  constructor(options: WorldbookPortErrorOptions<R>) {
    super(options);
  }
}
