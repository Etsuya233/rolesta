import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type {
  ChatCompletionConnectionClient,
  ListChatCompletionModelsRequest,
  TestChatCompletionRequest,
  TestChatCompletionResult,
} from '../application/chat-completion-connection-client.js';
import {
  ModelProviderApplicationError,
  type ModelProviderApplicationErrorReason,
} from '../application/model-provider-application-error.js';

@Injectable()
export class FetchChatCompletionConnectionClient implements ChatCompletionConnectionClient {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(FetchChatCompletionConnectionClient.name);
  }

  async listModels(request: ListChatCompletionModelsRequest): Promise<string[]> {
    const endpoint = joinEndpoint(request.baseUrl, 'models');
    const response = await this.fetchRemote(endpoint, {
      method: 'GET',
      headers: connectionHeaders(request.apiKeySecret),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      await this.logRemoteErrorResponse(response, {
        endpoint,
        operation: 'listModels',
        providerKind: request.providerKind,
      });
      throw remoteStatusError(response.status);
    }

    const remoteBody = await this.readJson(response, {
      endpoint,
      operation: 'listModels',
      providerKind: request.providerKind,
    });

    if (!isModelListResponse(remoteBody.value)) {
      this.logInvalidResponse(remoteBody, 'model-list-schema');
      throw new ModelProviderApplicationError('remote-response-invalid');
    }

    return remoteBody.value.data.map((model) => model.id);
  }

  async testChatCompletion(
    request: TestChatCompletionRequest,
  ): Promise<TestChatCompletionResult> {
    const endpoint = joinEndpoint(request.baseUrl, 'chat/completions');
    const response = await this.fetchRemote(endpoint, {
      method: 'POST',
      headers: connectionHeaders(request.apiKeySecret),
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: request.defaultModelName,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      await this.logRemoteErrorResponse(response, {
        endpoint,
        operation: 'testChatCompletion',
        providerKind: request.providerKind,
      });
      throw remoteStatusError(response.status);
    }

    const remoteBody = await this.readJson(response, {
      endpoint,
      operation: 'testChatCompletion',
      providerKind: request.providerKind,
    });

    if (!isChatCompletionResponse(remoteBody.value)) {
      this.logInvalidResponse(remoteBody, 'chat-completion-schema');
      throw new ModelProviderApplicationError('remote-response-invalid');
    }

    return {
      modelName: remoteBody.value.model ?? request.defaultModelName,
      remoteResponseId: remoteBody.value.id ?? null,
    };
  }

  private async fetchRemote(input: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(input, init);
    } catch (error) {
      if (error instanceof ModelProviderApplicationError) {
        throw error;
      }

      throw new ModelProviderApplicationError('remote-unreachable');
    }
  }

  private async readJson(
    response: Response,
    context: RemoteResponseLogContext,
  ): Promise<RemoteResponseBody> {
    const text = await response.text();
    const remoteBody = {
      ...context,
      status: response.status,
      contentType: response.headers.get('content-type'),
      bodyPreview: responseBodyPreview(text),
      bodyLength: text.length,
      value: undefined as unknown,
    };

    try {
      return { ...remoteBody, value: JSON.parse(text) };
    } catch {
      this.logInvalidResponse(remoteBody, 'json-parse');
      throw new ModelProviderApplicationError('remote-response-invalid');
    }
  }

  private async logRemoteErrorResponse(
    response: Response,
    context: RemoteResponseLogContext,
  ): Promise<void> {
    const text = await response.text();

    this.logger.warn(
      {
        operation: context.operation,
        providerKind: context.providerKind,
        endpoint: context.endpoint,
        status: response.status,
        contentType: response.headers.get('content-type'),
        bodyLength: text.length,
        bodyPreview: responseBodyPreview(text),
        remoteErrorReason: remoteStatusReason(response.status),
      },
      'Model provider remote request failed',
    );
  }

  private logInvalidResponse(
    remoteBody: Omit<RemoteResponseBody, 'value'>,
    invalidReason: RemoteResponseInvalidReason,
  ): void {
    this.logger.warn(
      {
        operation: remoteBody.operation,
        providerKind: remoteBody.providerKind,
        endpoint: remoteBody.endpoint,
        status: remoteBody.status,
        contentType: remoteBody.contentType,
        bodyLength: remoteBody.bodyLength,
        bodyPreview: remoteBody.bodyPreview,
        invalidReason,
      },
      'Model provider remote response was not recognized',
    );
  }
}

type RemoteResponseInvalidReason =
  | 'json-parse'
  | 'model-list-schema'
  | 'chat-completion-schema';

interface RemoteResponseLogContext {
  operation: 'listModels' | 'testChatCompletion';
  providerKind: string;
  endpoint: string;
}

interface RemoteResponseBody extends RemoteResponseLogContext {
  status: number;
  contentType: string | null;
  bodyLength: number;
  bodyPreview: string;
  value: unknown;
}

interface ModelListResponse {
  data: Array<{ id: string }>;
}

interface ChatCompletionResponse {
  id?: string;
  model?: string;
  choices: unknown[];
}

function connectionHeaders(apiKeySecret: string | undefined): Headers {
  const headers = new Headers();

  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');

  if (apiKeySecret !== undefined && apiKeySecret.length > 0) {
    headers.set('Authorization', `Bearer ${apiKeySecret}`);
  }

  return headers;
}

function joinEndpoint(baseUrl: string, endpoint: string): string {
  return `${baseUrl.replace(/\/+$/u, '')}/${endpoint}`;
}

function isModelListResponse(body: unknown): body is ModelListResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as { data?: unknown }).data) &&
    (body as { data: unknown[] }).data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { id?: unknown }).id === 'string',
    )
  );
}

function responseBodyPreview(body: string): string {
  return body.slice(0, 2_048);
}

function isChatCompletionResponse(body: unknown): body is ChatCompletionResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as { choices?: unknown }).choices) &&
    ((body as { id?: unknown }).id === undefined ||
      typeof (body as { id?: unknown }).id === 'string') &&
    ((body as { model?: unknown }).model === undefined ||
      typeof (body as { model?: unknown }).model === 'string')
  );
}

function remoteStatusError(status: number): ModelProviderApplicationError {
  return new ModelProviderApplicationError(remoteStatusReason(status));
}

function remoteStatusReason(status: number): ModelProviderApplicationErrorReason {
  if (status === 401 || status === 403) {
    return 'remote-auth-failed';
  }

  if (status === 404) {
    return 'remote-model-not-found';
  }

  return 'remote-error';
}
