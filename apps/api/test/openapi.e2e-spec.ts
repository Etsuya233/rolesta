import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { createOpenApiDocument } from '../src/openapi/create-openapi-document.js';

describe('OpenAPI document', () => {
  it('contains health and auth routes', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = configureApp(moduleRef.createNestApplication());
    await app.init();

    const document = createOpenApiDocument(app);

    expect(document.paths['/health']).toBeDefined();
    expect(document.paths['/auth/current-user']).toBeDefined();

    const response = document.paths['/auth/current-user']?.get?.responses['200'];
    expect(response).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['code', 'msg', 'data'],
            properties: {
              code: { type: 'number', enum: [0], example: 0 },
              msg: { type: 'string', example: 'ok' },
              data: { $ref: '#/components/schemas/CurrentUserResponseDto' },
            },
          },
        },
      },
    });

    await app.close();
  });
});
