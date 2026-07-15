import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Rolesta API')
    .setDescription('Rolesta backend API')
    .setVersion('0.1.0')
    .build();

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config), {
    version: '3.0',
  });
}
