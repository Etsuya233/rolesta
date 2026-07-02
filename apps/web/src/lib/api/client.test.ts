import { API_SUCCESS_CODE, ERROR_CODES, type ApiEnvelope } from '@rolesta/shared';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { ApiError, type ApiResult, requestApi } from './client';

describe('requestApi', () => {
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
    const envelope: ApiEnvelope<null> = {
      code: ERROR_CODES.VALIDATION_FAILED,
      msg: '请求失败',
      data: null,
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
      rawResponse: expect.any(Response),
    });
  });

  it('throws request errors when the request fails before receiving a response', async () => {
    const cause = new Error('network failed');
    const request = Promise.reject(cause) as Promise<{
      data?: ApiEnvelope<unknown>;
      error?: unknown;
      response: Response;
    }>;

    await expect(requestApi(request)).rejects.toMatchObject({
      kind: 'request',
      message: 'API request failed before receiving a response',
      cause,
    });
    await expect(requestApi(request)).rejects.toBeInstanceOf(ApiError);
  });
});
