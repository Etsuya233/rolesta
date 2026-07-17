import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Database } from '@rolesta/db';
import { API_SUCCESS_CODE } from '@rolesta/shared';
import type { Kysely } from 'kysely';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../packages/db/src/test-utils/create-test-database.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { KYSELY_DB } from '../src/database/database.provider.js';
import { DEFAULT_WORLDBOOK_SCAN_PREFERENCES } from '../src/worldbooks/domain/worldbook-scan-preferences.js';

describe('Worldbook scan preferences API', () => {
  let app: INestApplication | undefined;
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  let originalDatabasePath: string | undefined;

  beforeEach(async () => {
    originalDatabasePath = process.env.SQLITE_DATABASE_PATH;
    testDatabase = await createTestDatabase();
    process.env.SQLITE_DATABASE_PATH = testDatabase.databasePath;
    await testDatabase.db.destroy();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication(), {
      corsAllowedOrigins: ['http://localhost:5173'],
      requestBodyLimit: '1mb',
    });
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

  it('requires authentication and returns the domain defaults before configuration', async () => {
    await request(app!.getHttpServer() as App)
      .get('/worldbooks/scan-preferences')
      .expect(401);
    const token = await setupAdmin(app!);

    await request(app!.getHttpServer() as App)
      .get('/worldbooks/scan-preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          code: API_SUCCESS_CODE,
          msg: 'ok',
          data: DEFAULT_WORLDBOOK_SCAN_PREFERENCES,
        });
      });
  });

  it('persists and returns a complete user preference snapshot', async () => {
    const token = await setupAdmin(app!);
    const preferences = {
      ...DEFAULT_WORLDBOOK_SCAN_PREFERENCES,
      scanDepth: 6,
      minActivations: 2,
      minActivationsDepthMax: 12,
      budgetPercent: 40,
      budgetCap: 4096,
      recursive: true,
      caseSensitive: true,
      matchWholeWords: true,
      useGroupScoring: true,
      maxRecursionSteps: 8,
      includeNames: false,
      characterLoreInsertionStrategy: 'globalFirst',
    };

    await request(app!.getHttpServer() as App)
      .put('/worldbooks/scan-preferences')
      .set('Authorization', `Bearer ${token}`)
      .send(preferences)
      .expect(200)
      .expect((response) => {
        expect(responseBody<{ data: typeof preferences }>(response).data).toEqual(preferences);
      });

    await request(app!.getHttpServer() as App)
      .get('/worldbooks/scan-preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(responseBody<{ data: typeof preferences }>(response).data).toEqual(preferences);
      });
  });

  it('rejects incomplete and out-of-range preference snapshots', async () => {
    const token = await setupAdmin(app!);

    await request(app!.getHttpServer() as App)
      .put('/worldbooks/scan-preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ scanDepth: 2 })
      .expect(400);
    await request(app!.getHttpServer() as App)
      .put('/worldbooks/scan-preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...DEFAULT_WORLDBOOK_SCAN_PREFERENCES, budgetPercent: 101 })
      .expect(400);
  });
});

async function setupAdmin(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer() as App)
    .post('/auth/setup-admin')
    .send({ username: 'admin', password: 'very-secure-password' })
    .expect(201);

  return responseBody<{ data: { token: string } }>(response).data.token;
}

function responseBody<TBody>(response: { body: unknown }): TBody {
  return response.body as TBody;
}
