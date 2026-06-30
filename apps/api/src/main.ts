import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { loadAppConfig } from './config/app-config.js';

async function bootstrap(): Promise<void> {
  const config = loadAppConfig();
  const app = configureApp(await NestFactory.create(AppModule));

  const openApiConfig = new DocumentBuilder()
    .setTitle('Rolesta API')
    .setDescription('Rolesta backend API')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('/docs', app, document);

  await app.listen(config.port, config.host);
}

await bootstrap();
