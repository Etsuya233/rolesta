import { ApplicationError } from '../../common/errors/application-error.js';

export type FileApplicationErrorReason =
  | 'file-not-found'
  | 'invalid-crop'
  | 'invalid-image'
  | 'storage-unavailable'
  | 'unsupported-image';

export interface FileApplicationErrorOptions<TReason extends FileApplicationErrorReason> {
  reason: TReason;
  params: Record<string, unknown>;
  cause?: unknown;
}

export class FileApplicationError<
  TReason extends FileApplicationErrorReason = FileApplicationErrorReason,
> extends ApplicationError<TReason, Record<string, unknown>> {
  constructor(options: FileApplicationErrorOptions<TReason>) {
    super(options);
  }
}
