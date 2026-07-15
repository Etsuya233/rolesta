import { ApplicationError } from '../../common/errors/index.js';

export type WorldbookApplicationErrorReason =
  | 'not-found'
  | 'forbidden'
  | 'invalid-import-file'
  | 'invalid-worldbook'
  | 'duplicate-entry'
  | 'unknown-entry';

export interface WorldbookApplicationErrorParamsMap {
  'not-found': {
    worldbookId: string;
  };
  forbidden: {
    worldbookId: string;
    viewerUserId: string;
  };
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
  'duplicate-entry': {
    worldbookId: string;
    entryId: string;
  };
  'unknown-entry': {
    worldbookId: string;
    entryId?: string;
  };
}

export type WorldbookApplicationErrorParams<
  R extends WorldbookApplicationErrorReason = WorldbookApplicationErrorReason,
> = WorldbookApplicationErrorParamsMap[R];

export interface WorldbookApplicationErrorOptions<R extends WorldbookApplicationErrorReason> {
  reason: R;
  params: WorldbookApplicationErrorParams<R>;
  cause?: unknown;
}

export class WorldbookApplicationError<
  R extends WorldbookApplicationErrorReason = WorldbookApplicationErrorReason,
> extends ApplicationError<R, WorldbookApplicationErrorParams<R>> {
  constructor(options: WorldbookApplicationErrorOptions<R>) {
    super(options);
  }
}
