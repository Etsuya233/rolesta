import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import 'reflect-metadata';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { loadAppConfig } from './config/app-config.js';
import { loadLocalEnvFile } from './config/local-env.js';
import { createOpenApiDocument } from './openapi/create-openapi-document.js';

async function bootstrap(): Promise<void> {
  loadLocalEnvFile();
  const config = loadAppConfig();
  const app = configureApp(
    await NestFactory.create<NestExpressApplication>(AppModule, {
      bodyParser: false,
      bufferLogs: true,
    }),
    config,
  );
  app.useLogger(app.get(Logger));

  SwaggerModule.setup('/docs', app, createOpenApiDocument(app));

  await app.listen(config.port, config.host);
}

await bootstrap();
