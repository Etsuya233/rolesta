import { ValidationPipe, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
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
    }),
  );

  return app;
}
