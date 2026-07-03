import { API_SUCCESS_CODE, ERROR_CODES, type ApiEnvelope, type ApiErrorEnvelope } from '@rolesta/shared';
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import { clearAuthToken, setAuthToken } from '../auth/auth-token';
import { changeLocale } from '../i18n/i18n';
import {
  ApiError,
  applyActiveLocaleHeader,
  applyAuthTokenHeader,
  type ApiResult,
  requestApi,
} from './client';

describe('requestApi', () => {
  afterEach(() => {
    clearAuthToken();
  });

  it('unwraps successful API envelopes and keeps the raw envelope', async () => {
    const envelope = {
      code: API_SUCCESS_CODE,
      msg: 'ok',
      data: { user: null },
    } satisfies ApiEnvelope<{ user: null }>;
    const response = new Response(null, { status: 200 });

    const result = await requestApi(Promise.resolve({ data: envelope, response }));

    expectTypeOf(result).toEqualTypeOf<ApiResult<{ user: null }>>();

    expect(result.data).toEqual({ user: null });
    expect(result.envelope).toBe(envelope);
    expect(result.rawResponse).toBe(response);
  });

  it('throws API response errors and keeps the raw envelope', async () => {
    const envelope: ApiErrorEnvelope = {
      code: ERROR_CODES.VALIDATION_FAILED,
      msg: '请求失败',
      data: {},
    };
    const response = new Response(null, { status: 400 });

    await expect(requestApi(Promise.resolve({ error: envelope, response }))).rejects.toMatchObject({
      kind: 'response',
      code: ERROR_CODES.VALIDATION_FAILED,
      message: '请求失败',
      envelope,
      rawResponse: response,
    });
  });

  it('throws when the response does not contain an API envelope', async () => {
    const invalidResponse = Promise.resolve({
      data: { ok: true },
      response: new Response(null, { status: 200 }),
    }) as unknown as Promise<{
      data?: ApiEnvelope<unknown>;
      error?: unknown;
      response: Response;
    }>;

    await expect(requestApi(invalidResponse)).rejects.toMatchObject({
      kind: 'request',
      message: 'API response envelope is invalid',
    });
    await expect(requestApi(invalidResponse)).rejects.toHaveProperty('rawResponse', expect.any(Response));
  });

  it('throws request errors when the request fails before receiving a response', async () => {
    const cause = new Error('network failed');
    const request: Promise<{
      data?: ApiEnvelope<unknown>;
      error?: unknown;
      response: Response;
    }> = Promise.reject(cause);

    await expect(requestApi(request)).rejects.toMatchObject({
      kind: 'request',
      message: 'API request failed before receiving a response',
      cause,
    });
    await expect(requestApi(request)).rejects.toBeInstanceOf(ApiError);
  });

  it('sends the active locale with API requests', async () => {
    await changeLocale('ja-JP');

    const request = applyActiveLocaleHeader(new Request('http://127.0.0.1:3000/health'));

    expect(request.headers.get('Accept-Language')).toBe('ja-JP');
  });

  it('sends the bearer token when one is stored', () => {
    setAuthToken('stored-token');

    const request = applyAuthTokenHeader(new Request('http://127.0.0.1:3000/health'));

    expect(request.headers.get('Authorization')).toBe('Bearer stored-token');
  });

  it('clears the bearer header when no token is stored', () => {
    const request = new Request('http://127.0.0.1:3000/health', {
      headers: { Authorization: 'Bearer old-token' },
    });

    applyAuthTokenHeader(request);

    expect(request.headers.has('Authorization')).toBe(false);
  });
});
