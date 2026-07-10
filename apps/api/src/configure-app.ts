import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ERROR_CODES } from '@rolesta/shared';
import cookieParser from 'cookie-parser';
import type { AppConfig } from './config/app-config.js';
import { ApiExceptionFilter } from './http/api-exception.filter.js';
import { ResponseEnvelopeInterceptor } from './http/response-envelope.interceptor.js';
import { ApiFailure } from './http/api-failure.js';
import { HttpLoggingInterceptor } from './logging/http-logging.interceptor.js';

export function configureApp(
  app: NestExpressApplication,
  config: Pick<AppConfig, 'corsAllowedOrigins' | 'requestBodyLimit'>,
): NestExpressApplication {
  app.useBodyParser('json', { limit: config.requestBodyLimit });
  app.useBodyParser('urlencoded', { extended: true, limit: config.requestBodyLimit });
  app.enableCors({
    origin: config.corsAllowedOrigins,
    allowedHeaders: ['Accept', 'Accept-Language', 'Authorization', 'Content-Type'],
  });
  app.use(cookieParser());
  app.useGlobalFilters(app.get(ApiExceptionFilter));
  app.useGlobalInterceptors(app.get(HttpLoggingInterceptor), new ResponseEnvelopeInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: () =>
        new ApiFailure({
          status: HttpStatus.BAD_REQUEST,
          code: ERROR_CODES.VALIDATION_FAILED,
        }),
    }),
  );

  return app;
}
