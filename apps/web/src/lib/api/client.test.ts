import { ERROR_CODES, type ApiEnvelope } from '@rolesta/shared';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { ApiRequestError, type ApiFetchResult, requestApi } from './client';

describe('requestApi', () => {
  it('unwraps successful API envelopes and keeps the raw envelope', async () => {
    const envelope: ApiEnvelope<{ user: null }> = {
      code: 0,
      msg: 'ok',
      data: { user: null },
    };
    const response = new Response(null, { status: 200 });

    const result = await requestApi<{ user: null }>(Promise.resolve({ data: envelope, response }));

    expectTypeOf(result).toEqualTypeOf<ApiFetchResult<{ user: null }>>();
    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error('Expected successful API result');
    }

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

    const result = await requestApi<null>(Promise.resolve({ error: envelope, response }));

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error('Expected failed API result');
    }

    expect(result.errorCode).toBe(ERROR_CODES.VALIDATION_FAILED);
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

    await expect(requestApi<unknown>(invalidResponse)).rejects.toBeInstanceOf(ApiRequestError);
  });
});
