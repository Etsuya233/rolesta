import { HttpException, type HttpStatus } from '@nestjs/common';
import {
  DEFAULT_ERROR_MESSAGE_KEYS,
  ERROR_CODES,
  I18N_MESSAGE_PREFIX,
  type ErrorCode,
  type ErrorMessageParams,
} from '@rolesta/shared';

export type ApiFailureOptions = {
  status: HttpStatus;
  code: ErrorCode;
  reason: string;
  messageKey?: string;
  params?: ErrorMessageParams;
  cause?: unknown;
};

export class ApiFailure extends HttpException {
  readonly code: ErrorCode;
  readonly reason: string;
  readonly messageKey: string;
  readonly params: ErrorMessageParams;

  constructor(options: ApiFailureOptions) {
    const messageKey = options.messageKey ?? DEFAULT_ERROR_MESSAGE_KEYS[options.code];
    super(`${I18N_MESSAGE_PREFIX}${messageKey}`, options.status, { cause: options.cause });
    this.name = 'ApiFailure';
    this.code = options.code;
    this.reason = options.reason;
    this.messageKey = messageKey;
    this.params = options.params ?? {};
  }
}

export function createInternalApiFailure(): ApiFailure {
  return new ApiFailure({
    status: 500,
    code: ERROR_CODES.INTERNAL_ERROR,
    reason: 'unhandled-exception',
  });
}
