import { HttpStatus, ValidationPipe, type INestApplication } from '@nestjs/common';
import { ERROR_CODES } from '@rolesta/shared';
import cookieParser from 'cookie-parser';
import { ApiFailure } from './http/api-failure.js';
import { ApiExceptionFilter } from './http/api-exception.filter.js';
import { ResponseEnvelopeInterceptor } from './http/response-envelope.interceptor.js';

export function configureApp(app: INestApplication): INestApplication {
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
