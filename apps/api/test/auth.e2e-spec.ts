import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('Auth API skeleton', () => {
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

  it('returns no current user before session support is implemented', async () => {
    await request(app.getHttpServer() as App)
      .get('/auth/current-user')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          code: 0,
          msg: 'ok',
          data: { user: null },
        });
      });
  });

  it('returns validation failure in the shared envelope format', async () => {
    await request(app.getHttpServer() as App)
      .post('/auth/login')
      .send({ email: 'invalid-email', password: 'short' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toEqual({
          code: 'INTERNAL_ERROR',
          msg: 'failed',
          data: null,
        });
      });
  });
});
