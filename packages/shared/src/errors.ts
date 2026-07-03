export const ERROR_CODES = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const I18N_MESSAGE_PREFIX = 'i18n:';

export const DEFAULT_ERROR_MESSAGE_KEYS = {
  [ERROR_CODES.UNAUTHENTICATED]: 'errors.unauthenticated',
  [ERROR_CODES.FORBIDDEN]: 'errors.forbidden',
  [ERROR_CODES.NOT_FOUND]: 'errors.notFound',
  [ERROR_CODES.VALIDATION_FAILED]: 'errors.validationFailed',
  [ERROR_CODES.INTERNAL_ERROR]: 'errors.internalError',
} as const satisfies Record<ErrorCode, string>;

export type ErrorMessageParams = Record<string, unknown>;
