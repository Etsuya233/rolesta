import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { APP_CONFIG, ConfigModule } from '../config/config.module.js';
import type { AppConfig, AppLoggingConfig } from '../config/app-config.js';
import { ApiExceptionFilter } from '../http/api-exception.filter.js';
import { HttpLoggingInterceptor } from './http-logging.interceptor.js';
import { APP_LOGGING_CONFIG } from './logging.tokens.js';
import { pinoHttpOptionsFor } from './pino-http-options.js';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        pinoHttp: pinoHttpOptionsFor(config.logging),
      }),
    }),
  ],
  providers: [
    ApiExceptionFilter,
    HttpLoggingInterceptor,
    {
      provide: APP_LOGGING_CONFIG,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): AppLoggingConfig => config.logging,
    },
  ],
  exports: [ApiExceptionFilter, HttpLoggingInterceptor, APP_LOGGING_CONFIG, LoggerModule],
})
export class ApiLoggerModule {}
