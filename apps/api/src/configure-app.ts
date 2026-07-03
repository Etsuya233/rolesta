import { HttpStatus, ValidationPipe, type INestApplication } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import cookieParser from 'cookie-parser';
import type { AppConfig } from './config/app-config.js';
import { ApiFailure } from './http/api-failure.js';
import { ApiExceptionFilter } from './http/api-exception.filter.js';
import { ResponseEnvelopeInterceptor } from './http/response-envelope.interceptor.js';

export function configureApp(
  app: INestApplication,
  config: Pick<AppConfig, 'corsAllowedOrigins'>,
): INestApplication {
  app.enableCors({
    origin: config.corsAllowedOrigins,
    allowedHeaders: ['Accept', 'Accept-Language', 'Authorization', 'Content-Type'],
  });
  app.use(cookieParser());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
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
