import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { loadAppConfig } from './config/app-config.js';
import { createOpenApiDocument } from './openapi/create-openapi-document.js';

async function bootstrap(): Promise<void> {
  const config = loadAppConfig();
  const app = configureApp(await NestFactory.create(AppModule));

  SwaggerModule.setup('/docs', app, createOpenApiDocument(app));

  await app.listen(config.port, config.host);
}

await bootstrap();
