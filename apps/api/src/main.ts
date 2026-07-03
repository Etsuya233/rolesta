import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { loadAppConfig } from './config/app-config.js';
import { loadLocalEnvFile } from './config/local-env.js';
import { createOpenApiDocument } from './openapi/create-openapi-document.js';

async function bootstrap(): Promise<void> {
  loadLocalEnvFile();
  const config = loadAppConfig();
  const app = configureApp(await NestFactory.create(AppModule), config);

  SwaggerModule.setup('/docs', app, createOpenApiDocument(app));

  await app.listen(config.port, config.host);
}

await bootstrap();
