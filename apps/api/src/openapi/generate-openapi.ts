import { promises as fs } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { configureApp } from '../configure-app.js';
import { createOpenApiDocument } from './create-openapi-document.js';

const app = configureApp(await NestFactory.create(AppModule, { logger: false }));
await app.init();

const document = createOpenApiDocument(app);
await fs.writeFile('openapi.json', `${JSON.stringify(document, null, 2)}\n`, 'utf8');

await app.close();
