import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Database } from '@rolesta/db';
import { API_SUCCESS_CODE, ERROR_CODES, I18N_MESSAGE_PREFIX } from '@rolesta/shared';
import type { Kysely } from 'kysely';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../packages/db/src/test-utils/create-test-database.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { KYSELY_DB } from '../src/database/database.provider.js';

type SuccessEnvelope<TData> = {
  code: typeof API_SUCCESS_CODE;
  msg: string;
  data: TData;
};

type AuthenticatedUserBody = SuccessEnvelope<{
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    role: 'admin' | 'user';
  };
}>;

describe('Auth API', () => {
  let app: INestApplication | undefined;
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  let originalDatabasePath: string | undefined;

  beforeEach(async () => {
    originalDatabasePath = process.env.SQLITE_DATABASE_PATH;
    testDatabase = await createTestDatabase();
    process.env.SQLITE_DATABASE_PATH = testDatabase.databasePath;
    await testDatabase.db.destroy();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    const db = app?.get<Kysely<Database>>(KYSELY_DB, { strict: false });
    await app?.close();
    await db?.destroy();
    await testDatabase?.destroy();

    if (originalDatabasePath === undefined) {
      delete process.env.SQLITE_DATABASE_PATH;
    } else {
      process.env.SQLITE_DATABASE_PATH = originalDatabasePath;
    }
  });

  it('requires setup when no users exist', async () => {
    await request(app!.getHttpServer() as App)
      .get('/auth/setup-status')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          code: API_SUCCESS_CODE,
          msg: 'ok',
          data: { requiresSetup: true },
        });
      });
  });

  it('creates the first administrator and returns a bearer token', async () => {
    await request(app!.getHttpServer() as App)
      .post('/auth/setup-admin')
      .send({ username: 'admin', password: 'very-secure-password' })
      .expect(201)
      .expect((response) => {
        const body = responseBody<AuthenticatedUserBody>(response);

        expect(body).toMatchObject({
          code: API_SUCCESS_CODE,
          msg: 'ok',
          data: {
            user: {
              username: 'admin',
              displayName: 'admin',
              role: 'admin',
            },
          },
        });
        expect(body.data.user.id).toEqual(expect.any(String));
        expect(body.data.token).toEqual(expect.any(String));
      });

    await request(app!.getHttpServer() as App)
      .get('/auth/setup-status')
      .expect(200)
      .expect((response) => {
        const body = responseBody<SuccessEnvelope<{ requiresSetup: boolean }>>(response);
        expect(body.data).toEqual({ requiresSetup: false });
      });
  });

  it('rejects repeated administrator setup', async () => {
    await setupAdmin(app);

    await request(app!.getHttpServer() as App)
      .post('/auth/setup-admin')
      .send({ username: 'second-admin', password: 'very-secure-password' })
      .expect(403)
      .expect((response) => {
        expect(response.body).toEqual({
          code: ERROR_CODES.FORBIDDEN,
          msg: `${I18N_MESSAGE_PREFIX}errors.forbidden`,
          data: {},
        });
      });
  });

  it('logs in with username and password', async () => {
    await setupAdmin(app);

    await request(app!.getHttpServer() as App)
      .post('/auth/login')
      .send({ username: 'admin', password: 'very-secure-password' })
      .expect(201)
      .expect((response) => {
        const body = responseBody<AuthenticatedUserBody>(response);
        expect(body.data.token).toEqual(expect.any(String));
        expect(body.data.user).toMatchObject({ username: 'admin', role: 'admin' });
      });
  });

  it('rejects invalid login credentials', async () => {
    await setupAdmin(app);

    await request(app!.getHttpServer() as App)
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong-password-value' })
      .expect(401)
      .expect((response) => {
        expect(response.body).toEqual({
          code: ERROR_CODES.UNAUTHENTICATED,
          msg: `${I18N_MESSAGE_PREFIX}errors.unauthenticated`,
          data: {},
        });
      });
  });

  it('returns current user for a valid bearer token', async () => {
    const token = await setupAdmin(app);

    await request(app!.getHttpServer() as App)
      .get('/auth/current-user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        const body = responseBody<SuccessEnvelope<{ user: AuthenticatedUserBody['data']['user'] }>>(
          response,
        );
        expect(body.data.user).toMatchObject({ username: 'admin', role: 'admin' });
      });
  });

  it('returns no current user without a bearer token', async () => {
    await request(app!.getHttpServer() as App)
      .get('/auth/current-user')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          code: API_SUCCESS_CODE,
          msg: 'ok',
          data: { user: null },
        });
      });
  });

  it('logs out by deleting the current session token', async () => {
    const token = await setupAdmin(app);

    await request(app!.getHttpServer() as App)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect((response) => {
        const body = responseBody<SuccessEnvelope<{ ok: true }>>(response);
        expect(body.data).toEqual({ ok: true });
      });

    await request(app!.getHttpServer() as App)
      .get('/auth/current-user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        const body = responseBody<SuccessEnvelope<{ user: null }>>(response);
        expect(body.data).toEqual({ user: null });
      });
  });

  it('returns validation failure in the shared envelope format', async () => {
    await request(app!.getHttpServer() as App)
      .post('/auth/login')
      .send({ username: '', password: 'short' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toEqual({
          code: ERROR_CODES.VALIDATION_FAILED,
          msg: `${I18N_MESSAGE_PREFIX}errors.validationFailed`,
          data: {},
        });
      });
  });
});

async function setupAdmin(app: INestApplication | undefined): Promise<string> {
  if (!app) {
    throw new Error('Test application is not initialized.');
  }

  const response = await request(app.getHttpServer() as App)
    .post('/auth/setup-admin')
    .send({ username: 'admin', password: 'very-secure-password' })
    .expect(201);

  return responseBody<AuthenticatedUserBody>(response).data.token;
}

function responseBody<TBody>(response: { body: unknown }): TBody {
  return response.body as TBody;
}
