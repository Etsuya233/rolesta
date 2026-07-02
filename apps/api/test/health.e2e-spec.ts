import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { API_SUCCESS_CODE } from '@rolesta/shared';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('Health API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns service status', async () => {
    await request(app.getHttpServer() as App)
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          code: API_SUCCESS_CODE,
          msg: 'ok',
          data: {
            status: 'ok',
            service: 'rolesta-api',
          },
        });
      });
  });
});
