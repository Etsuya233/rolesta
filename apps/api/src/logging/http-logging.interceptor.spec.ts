import { HttpException, HttpStatus, type CallHandler, type ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import { lastValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, type Mock, vi } from 'vitest';
import type { AppLoggingConfig } from '../config/app-config.js';
import { HttpLoggingInterceptor } from './http-logging.interceptor.js';

const enabledConfig: AppLoggingConfig = {
  level: 'info',
  httpEnabled: true,
  pretty: true,
  fileEnabled: false,
  filePath: '.data/logs/api.log',
};

type LoggedFields = {
  event: 'http.completed' | 'http.failed';
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  request: {
    id: string;
    headers: Request['headers'];
    query: Request['query'];
    params: Request['params'];
    ip: string | undefined;
  };
  response: {
    headers: ReturnType<Response['getHeaders']>;
    body?: unknown;
  };
};

type LoggerStub = PinoLogger & {
  info: Mock<(fields: LoggedFields, message: string) => void>;
};

describe('HttpLoggingInterceptor', () => {
  it('writes an access log when HTTP logging is enabled', async () => {
    const logger = loggerStub();
    const interceptor = new HttpLoggingInterceptor(logger, enabledConfig);
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    await lastValueFrom(interceptor.intercept(httpContextFor(201), next));

    const [fields, message] = firstInfoCall(logger);

    expect(fields).toMatchObject({
      event: 'http.completed',
      method: 'GET',
      path: '/health',
      statusCode: 201,
      request: {
        id: 'request-1',
        headers: { 'user-agent': 'vitest' },
        query: { verbose: 'true' },
        params: {},
        ip: '127.0.0.1',
      },
      response: {
        headers: { 'content-type': 'application/json' },
        body: { ok: true },
      },
    });
    expect(typeof fields.durationMs).toBe('number');
    expect(message).toBe('HTTP request completed');
  });

  it('does not write access logs when HTTP logging is disabled', async () => {
    const logger = loggerStub();
    const interceptor = new HttpLoggingInterceptor(logger, {
      ...enabledConfig,
      httpEnabled: false,
    });
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    await lastValueFrom(interceptor.intercept(httpContextFor(204), next));

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('does not include binary response content', async () => {
    const logger = loggerStub();
    const interceptor = new HttpLoggingInterceptor(logger, enabledConfig);
    const next: CallHandler = {
      handle: () => of(Buffer.from('image')),
    };

    await lastValueFrom(interceptor.intercept(httpContextFor(200), next));

    const [fields] = firstInfoCall(logger);
    expect(fields.response).toEqual({
      headers: { 'content-type': 'application/json' },
    });
  });

  it('writes failed access logs and rethrows the exception', async () => {
    const logger = loggerStub();
    const interceptor = new HttpLoggingInterceptor(logger, enabledConfig);
    const error = new HttpException('nope', HttpStatus.BAD_REQUEST);
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    await expect(lastValueFrom(interceptor.intercept(httpContextFor(200), next))).rejects.toBe(
      error,
    );

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http.failed',
        statusCode: 400,
        response: {
          headers: { 'content-type': 'application/json' },
        },
      }),
      'HTTP request failed',
    );
  });
});

function loggerStub(): LoggerStub {
  return {
    info: vi.fn<(fields: LoggedFields, message: string) => void>(),
  } as unknown as LoggerStub;
}

function firstInfoCall(logger: LoggerStub): [LoggedFields, string] {
  const call = logger.info.mock.calls[0];
  if (call === undefined) {
    throw new Error('Expected one info log call.');
  }

  return call;
}

function httpContextFor(statusCode: number): ExecutionContext {
  const request: Pick<
    Request,
    'id' | 'method' | 'originalUrl' | 'ip' | 'headers' | 'query' | 'params'
  > = {
    id: 'request-1',
    method: 'GET',
    originalUrl: '/health',
    ip: '127.0.0.1',
    query: { verbose: 'true' },
    params: {},
    headers: {
      'user-agent': 'vitest',
    },
  };
  const response: Pick<Response, 'statusCode' | 'getHeaders' | 'headersSent'> = {
    statusCode,
    headersSent: false,
    getHeaders: () => ({ 'content-type': 'application/json' }),
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}
