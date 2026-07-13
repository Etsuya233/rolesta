import { Test } from '@nestjs/testing';
import { API_SUCCESS_CODE } from '@rolesta/shared';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { createOpenApiDocument } from '../src/openapi/create-openapi-document.js';

describe('OpenAPI document', () => {
  it('contains health and auth routes', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = configureApp(moduleRef.createNestApplication(), {
      corsAllowedOrigins: ['http://localhost:5173'],
      requestBodyLimit: '1mb',
    });
    await app.init();

    const document = createOpenApiDocument(app);

    expect(document.paths['/health']).toBeDefined();
    expect(document.paths['/auth/current-user']).toBeDefined();
    expect(document.paths['/characters']).toBeDefined();
    expect(document.paths['/chat-preferences/assets']?.get).toBeDefined();
    expect(document.paths['/chat-preferences/assets']?.patch?.requestBody).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateAssetDefaultsRequestDto' },
        },
      },
    });

    const response = document.paths['/auth/current-user']?.get?.responses['200'];
    expect(response).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['code', 'msg', 'data'],
            properties: {
              code: { type: 'string', enum: [API_SUCCESS_CODE], example: API_SUCCESS_CODE },
              msg: { type: 'string', example: 'ok' },
              data: { $ref: '#/components/schemas/CurrentUserResponseDto' },
            },
          },
        },
      },
    });

    expect(document.paths['/characters']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'query', name: 'scope' }),
        expect.objectContaining({ in: 'query', name: 'sort' }),
        expect.objectContaining({ in: 'query', name: 'pageIndex' }),
        expect.objectContaining({ in: 'query', name: 'pageSize' }),
      ]),
    );
    expect(document.paths['/characters']?.post?.requestBody).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateCharacterRequestDto' },
        },
      },
    });
    for (const path of ['/worldbooks', '/presets'] as const) {
      expect(document.paths[path]?.get?.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ in: 'query', name: 'scope' }),
        ]),
      );
    }
    const presetSummarySchema = document.components?.schemas
      ?.PresetSummaryResponseDto as {
      required?: string[];
      properties?: Record<string, unknown>;
    };
    expect(presetSummarySchema.required).toContain('visibility');
    expect(presetSummarySchema.properties?.visibility).toMatchObject({
      type: 'string',
      enum: ['private', 'public'],
    });
    expect(document.paths['/characters/{id}']?.patch?.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ in: 'path', name: 'id' })]),
    );
    expect(document.paths['/characters/{id}']?.patch?.requestBody).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UpdateCharacterRequestDto' },
        },
      },
    });
    expect(document.paths['/characters/import']?.post?.requestBody).toMatchObject({
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: { file: { type: 'string', format: 'binary' } },
          },
        },
      },
    });
    expect(document.paths['/characters/{id}/export/sillytavern']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'path', name: 'id' }),
        expect.objectContaining({ in: 'query', name: 'version' }),
      ]),
    );

    await app.close();
  });
});
