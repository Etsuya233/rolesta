import { performance } from 'node:perf_hooks';
import { HttpException, Inject, Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
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
      tap(() => {
        this.logger.info(
          this.logFieldsFor(request, response.statusCode, startedAt),
          'HTTP request completed',
        );
      }),
      catchError((error: unknown) => {
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        this.logger.info(this.logFieldsFor(request, statusCode, startedAt), 'HTTP request failed');

        return throwError(() => error);
      }),
    );
  }

  private logFieldsFor(request: Request, statusCode: number, startedAt: number) {
    return {
      method: request.method,
      path: request.originalUrl,
      statusCode,
      durationMs: Math.round(performance.now() - startedAt),
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };
  }
}
