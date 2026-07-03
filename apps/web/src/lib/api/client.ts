import {
  API_SUCCESS_CODE,
  ERROR_CODES,
  type ApiEnvelope,
  type ApiErrorEnvelope,
  type ApiEnvelopeCode,
  type SuccessCode,
} from '@rolesta/shared';
import createClient from 'openapi-fetch';
import { getAuthToken } from '../auth/auth-token';
import { getActiveLocale } from '../i18n/i18n';
import type { paths } from './generated/schema';

const API_BASE_URL =
  typeof import.meta.env.API_BASE_URL === 'string'
    ? import.meta.env.API_BASE_URL
    : 'http://127.0.0.1:3000';

const ERROR_CODE_VALUES: readonly string[] = Object.values(ERROR_CODES);

type OpenApiResponse = {
  data?: unknown;
  error?: unknown;
  response: Response;
};

type SuccessEnvelope<TRequest extends Promise<OpenApiResponse>> = NonNullable<
  Awaited<TRequest>['data']
>;

type EnvelopeData<TEnvelope> = TEnvelope extends { code: SuccessCode; data: infer TData }
  ? TData
  : never;

type RequestData<TRequest extends Promise<OpenApiResponse>> = EnvelopeData<SuccessEnvelope<TRequest>>;

export type ApiResult<TData> = {
  data: TData;
  envelope: ApiEnvelope<TData>;
  rawResponse: Response;
};

export type ApiErrorKind = 'request' | 'response';

type ApiErrorOptions = {
  kind: ApiErrorKind;
  rawResponse?: Response;
  code?: Exclude<ApiEnvelopeCode, SuccessCode>;
  envelope?: ApiErrorEnvelope;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly rawResponse: Response | undefined;
  readonly code: Exclude<ApiEnvelopeCode, SuccessCode> | undefined;
  readonly envelope: ApiErrorEnvelope | undefined;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = options.kind;
    this.rawResponse = options.rawResponse;
    this.code = options.code;
    this.envelope = options.envelope;
  }
}

export const openApiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

openApiClient.use({
  onRequest({ request }) {
    applyActiveLocaleHeader(request);
    applyAuthTokenHeader(request);
    return request;
  },
});

export function applyActiveLocaleHeader(request: Request): Request {
  request.headers.set('Accept-Language', getActiveLocale());
  return request;
}

export function applyAuthTokenHeader(request: Request): Request {
  const token = getAuthToken();

  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  } else {
    request.headers.delete('Authorization');
  }

  return request;
}

export async function requestApi<TRequest extends Promise<OpenApiResponse>>(
  request: TRequest,
): Promise<ApiResult<RequestData<TRequest>>> {
  let response: Awaited<TRequest>;

  try {
    response = await request;
  } catch (cause) {
    throw new ApiError('API request failed before receiving a response', { kind: 'request', cause });
  }

  // openapi-fetch puts 2xx JSON in data and non-2xx JSON in error; both are API envelopes here.
  const envelope = response.data ?? response.error;

  if (!isApiEnvelope(envelope)) {
    throw new ApiError('API response envelope is invalid', {
      kind: 'request',
      rawResponse: response.response,
    });
  }

  if (envelope.code === API_SUCCESS_CODE) {
    const successEnvelope = envelope as ApiEnvelope<RequestData<TRequest>>;

    return {
      data: successEnvelope.data,
      envelope: successEnvelope,
      rawResponse: response.response,
    };
  }

  throw new ApiError(envelope.msg, {
    kind: 'response',
    code: envelope.code,
    envelope: envelope as ApiErrorEnvelope,
    rawResponse: response.response,
  });
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('code' in value) || !('msg' in value) || !('data' in value)) {
    return false;
  }

  const code = value.code;

  return (
    (code === API_SUCCESS_CODE || (typeof code === 'string' && ERROR_CODE_VALUES.includes(code))) &&
    typeof value.msg === 'string' &&
    'data' in value
  );
}
