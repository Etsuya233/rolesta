import type { ErrorCode } from './errors.js';

export type ApiEnvelopeCode = 0 | ErrorCode;

export interface ApiEnvelope<TData = unknown> {
  code: ApiEnvelopeCode;
  msg: string;
  data: TData;
}
