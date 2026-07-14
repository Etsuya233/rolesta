import { PortError } from '../../common/errors/port-error.js';

export type FilePortErrorReason =
  | 'content-conflict'
  | 'content-unavailable'
  | 'invalid-image'
  | 'resource-state-conflict'
  | 'unsupported-image';

export interface FilePortErrorOptions {
  reason: FilePortErrorReason;
  params: Record<string, unknown>;
  cause?: unknown;
}

export class FilePortError extends PortError<FilePortErrorReason, Record<string, unknown>> {
  constructor(options: FilePortErrorOptions) {
    super(options);
  }
}
