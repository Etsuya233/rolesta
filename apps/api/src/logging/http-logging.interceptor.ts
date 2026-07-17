import { performance } from 'node:perf_hooks';
import {
  HttpException,
  Inject,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { catchError, tap, throwError, type Observable } from 'rxjs';
import type { AppLoggingConfig } from '../config/app-config.js';
import { APP_LOGGING_CONFIG } from './logging.tokens.js';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(HttpLoggingInterceptor.name)
    private readonly logger: PinoLogger,
    @Inject(APP_LOGGING_CONFIG)
    private readonly config: AppLoggingConfig,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.config.httpEnabled) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = performance.now();

    return next.handle().pipe(
      tap((body) => {
        this.logger.info(
          this.logFieldsFor('http.completed', request, response, startedAt, body),
          'HTTP request completed',
        );
      }),
      catchError((error: unknown) => {
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        this.logger.info(
          this.logFieldsFor('http.failed', request, response, startedAt, undefined, statusCode),
          'HTTP request failed',
        );

        return throwError(() => error);
      }),
    );
  }

  private logFieldsFor(
    event: 'http.completed' | 'http.failed',
    request: Request,
    response: Response,
    startedAt: number,
    body?: unknown,
    statusCode = response.statusCode,
  ) {
    const responseDetails: { headers: ReturnType<Response['getHeaders']>; body?: unknown } = {
      headers: response.getHeaders(),
    };
    if (
      !response.headersSent &&
      body !== undefined &&
      !Buffer.isBuffer(body) &&
      !isReadableStream(body)
    ) {
      responseDetails.body = body;
    }

    return {
      event,
      method: request.method,
      path: request.originalUrl,
      statusCode,
      durationMs: Math.round(performance.now() - startedAt),
      request: {
        id: request.id,
        headers: request.headers,
        query: request.query,
        params: request.params,
        ip: request.ip,
      },
      response: responseDetails,
    };
  }
}

function isReadableStream(value: unknown): value is NodeJS.ReadableStream {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pipe' in value &&
    typeof value.pipe === 'function'
  );
}
