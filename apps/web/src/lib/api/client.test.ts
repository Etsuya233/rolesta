import { API_SUCCESS_CODE, ERROR_CODES, type ApiEnvelope } from '@rolesta/shared';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { ApiRequestError, type ApiFetchResult, requestApi } from './client';

describe('requestApi', () => {
  it('unwraps successful API envelopes and keeps the raw envelope', async () => {
    const envelope = {
      code: API_SUCCESS_CODE,
      msg: 'ok',
      data: { user: null },
    } satisfies ApiEnvelope<{ user: null }>;
    const response = new Response(null, { status: 200 });

    const result = await requestApi(Promise.resolve({ data: envelope, response }));

    expectTypeOf(result).toEqualTypeOf<ApiFetchResult<{ user: null }>>();
    expect(result.ok).toBe(true);

    expect(result.code).toBe(API_SUCCESS_CODE);
    expect(result.msg).toBe('ok');
    expect(result.data).toEqual({ user: null });
    expect(result.envelope).toBe(envelope);
    expect(result.rawResponse).toBe(response);
  });

  it('returns API error codes and keeps the raw envelope', async () => {
    const envelope: ApiEnvelope<null> = {
      code: ERROR_CODES.VALIDATION_FAILED,
      msg: '请求失败',
      data: null,
    };
    const response = new Response(null, { status: 400 });

    const result = await requestApi(Promise.resolve({ error: envelope, response }));

    expect(result.ok).toBe(false);
    expect(result.code).toBe(ERROR_CODES.VALIDATION_FAILED);
    expect(result.msg).toBe('请求失败');
    expect(result.data).toBeNull();
    expect(result.envelope).toBe(envelope);
    expect(result.rawResponse).toBe(response);
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

    await expect(requestApi(invalidResponse)).rejects.toBeInstanceOf(ApiRequestError);
  });
});
