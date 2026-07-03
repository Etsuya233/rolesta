import type { ErrorCode, ErrorMessageParams } from './errors.js';

export const API_SUCCESS_CODE = 'SUCCESS';

export type SuccessCode = typeof API_SUCCESS_CODE;

export type ApiEnvelopeCode = SuccessCode | ErrorCode;

export interface ApiEnvelope<TData = unknown> {
  code: ApiEnvelopeCode;
  msg: string;
  data: TData;
}

export type ApiErrorEnvelope<TParams extends ErrorMessageParams = ErrorMessageParams> =
  ApiEnvelope<TParams> & {
    code: ErrorCode;
  };
