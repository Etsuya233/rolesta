import { ERROR_CODES, type ApiEnvelope, type ErrorCode } from '@rolesta/shared';
import createClient from 'openapi-fetch';
import type { paths } from './generated/schema';

const API_BASE_URL =
  typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://127.0.0.1:3000';

const ERROR_CODE_VALUES: readonly string[] = Object.values(ERROR_CODES);

type OpenApiResponse<TEnvelope> = {
  data?: TEnvelope;
  error?: unknown;
  response: Response;
};

export type ApiFetchResult<TData> =
  | {
      ok: true;
      data: TData;
      envelope: ApiEnvelope<TData>;
      rawResponse: Response;
    }
  | {
      ok: false;
      errorCode: ErrorCode;
      envelope: ApiEnvelope<unknown>;
      rawResponse: Response;
    };

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly rawResponse?: Response,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export const openApiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  headers: {
    Accept: 'application/json',
  },
});

export async function requestApi<TData>(
  request: Promise<OpenApiResponse<ApiEnvelope<TData>>>,
): Promise<ApiFetchResult<TData>> {
  let response: OpenApiResponse<ApiEnvelope<TData>>;

  try {
    response = await request;
  } catch (cause) {
    throw new ApiRequestError('API request failed before receiving a response', undefined, { cause });
  }

  // openapi-fetch puts 2xx JSON in data and non-2xx JSON in error; both are API envelopes here.
  const envelope = response.data ?? response.error;

  if (!isApiEnvelope(envelope)) {
    throw new ApiRequestError('API response envelope is invalid', response.response);
  }

  if (envelope.code === 0) {
    const successEnvelope = envelope as ApiEnvelope<TData>;

    return {
      ok: true,
      data: successEnvelope.data,
      envelope: successEnvelope,
      rawResponse: response.response,
    };
  }

  return {
    ok: false,
    errorCode: envelope.code,
    envelope,
    rawResponse: response.response,
  };
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
    (code === 0 || (typeof code === 'string' && ERROR_CODE_VALUES.includes(code))) &&
    typeof value.msg === 'string'
  );
}
