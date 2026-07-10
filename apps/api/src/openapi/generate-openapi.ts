import { promises as fs } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../app.module.js';
import { configureApp } from '../configure-app.js';
import { loadAppConfig } from '../config/app-config.js';
import { loadLocalEnvFile } from '../config/local-env.js';
import { createOpenApiDocument } from './create-openapi-document.js';

loadLocalEnvFile();
const app = configureApp(
  await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: false,
  }),
  loadAppConfig(),
);
await app.init();

const document = createOpenApiDocument(app);
await fs.writeFile('openapi.json', `${JSON.stringify(document, null, 2)}\n`, 'utf8');

await app.close();
