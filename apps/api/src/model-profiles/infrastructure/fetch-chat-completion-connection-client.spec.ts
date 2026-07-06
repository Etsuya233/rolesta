import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { PinoLogger } from 'nestjs-pino';
import { ModelProviderApplicationError } from '../application/model-provider-application-error.js';
import { FetchChatCompletionConnectionClient } from './fetch-chat-completion-connection-client.js';

describe('FetchChatCompletionConnectionClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('logs structured diagnostics when chat completion response shape is invalid', async () => {
    const logger = loggerStub();
    const client = new FetchChatCompletionConnectionClient(logger);
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: 'unsupported endpoint',
            authorization: 'Bearer should-not-leak',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    await expect(
      client.testChatCompletion({
        providerKind: 'openai-compatible',
        baseUrl: 'https://example.test/v1',
        defaultModelName: 'model-a',
        apiKeySecret: undefined,
      }),
    ).rejects.toMatchObject(new ModelProviderApplicationError('remote-response-invalid'));

    const [fields, message] = firstWarnCall(logger);

    expect(fields).toMatchObject({
      operation: 'testChatCompletion',
      providerKind: 'openai-compatible',
      endpoint: 'https://example.test/v1/chat/completions',
      status: 200,
      contentType: 'application/json',
      invalidReason: 'chat-completion-schema',
    });
    expect(fields.bodyPreview).toContain('should-not-leak');
    expect(message).toBe('Model provider remote response was not recognized');
  });

  it('logs structured diagnostics when model list request returns a remote error', async () => {
    const logger = loggerStub();
    const client = new FetchChatCompletionConnectionClient(logger);
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'not found' } }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(
      client.listModels({
        providerKind: 'openai-compatible',
        baseUrl: 'https://example.test/v1',
        apiKeySecret: undefined,
      }),
    ).rejects.toMatchObject(new ModelProviderApplicationError('remote-model-not-found'));

    const [fields, message] = firstWarnCall(logger);

    expect(fields).toMatchObject({
      operation: 'listModels',
      providerKind: 'openai-compatible',
      endpoint: 'https://example.test/v1/models',
      status: 404,
      contentType: 'application/json',
      remoteErrorReason: 'remote-model-not-found',
    });
    expect(fields.bodyPreview).toContain('not found');
    expect(message).toBe('Model provider remote request failed');
  });
});

interface RemoteResponseLogFields {
  operation: string;
  providerKind: string;
  endpoint: string;
  status: number;
  contentType: string | null;
  invalidReason?: string;
  remoteErrorReason?: string;
  bodyLength: number;
  bodyPreview: string;
}

type LoggerStub = PinoLogger & {
  warn: Mock<(fields: RemoteResponseLogFields, message: string) => void>;
};

function loggerStub(): LoggerStub {
  return {
    warn: vi.fn(),
  } as unknown as LoggerStub;
}

function firstWarnCall(logger: LoggerStub): [RemoteResponseLogFields, string] {
  const firstCall = logger.warn.mock.calls[0];

  if (firstCall === undefined) {
    throw new Error('Expected logger.warn to be called.');
  }

  return firstCall;
}
