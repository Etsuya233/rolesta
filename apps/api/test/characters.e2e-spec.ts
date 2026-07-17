import { createHash } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Database } from '@rolesta/db';
import type { API_SUCCESS_CODE } from '@rolesta/shared';
import type { Kysely } from 'kysely';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import sharp from 'sharp';
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

describe('Characters API', () => {
  let app: INestApplication | undefined;
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  let originalDatabasePath: string | undefined;
  let originalFileStorageDriver: string | undefined;

  beforeEach(async () => {
    originalDatabasePath = process.env.SQLITE_DATABASE_PATH;
    originalFileStorageDriver = process.env.FILE_STORAGE_DRIVER;
    testDatabase = await createTestDatabase();
    process.env.SQLITE_DATABASE_PATH = testDatabase.databasePath;
    process.env.FILE_STORAGE_DRIVER = 'database';
    await testDatabase.db.destroy();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    if (originalFileStorageDriver === undefined) {
      delete process.env.FILE_STORAGE_DRIVER;
    } else {
      process.env.FILE_STORAGE_DRIVER = originalFileStorageDriver;
    }
  });

  it('uploads a cropped avatar with browser-precision coordinates', async () => {
    const token = await setupAdmin(app!);
    const createResponse = await request(app!.getHttpServer() as App)
      .post('/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Avatar Card' })
      .expect(201);
    const id = responseBody<SuccessEnvelope<{ id: string }>>(createResponse).data.id;
    const image = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: '#cc3344',
      },
    })
      .png()
      .toBuffer();

    await request(app!.getHttpServer() as App)
      .put(`/characters/${id}/avatar`)
      .set('Authorization', `Bearer ${token}`)
      .field('x', '0.123456789')
      .field('y', '0.123456789')
      .field('width', '0.5')
      .field('height', '0.5')
      .attach('file', image, { filename: 'avatar.png', contentType: 'image/png' })
      .expect(200)
      .expect((response) => {
        const body = responseBody<SuccessEnvelope<{ avatar: { sources: Record<string, string> } }>>(
          response,
        );
        expect(body.data.avatar.sources).toHaveProperty('128');
      });
  });

  it('imports a SillyTavern JSON character and lists it in all scope', async () => {
    const token = await setupAdmin(app!);

    await request(app!.getHttpServer() as App)
      .post('/characters/import')
      .set('Authorization', `Bearer ${token}`)
      .attach(
        'file',
        Buffer.from(
          JSON.stringify({
            spec: 'chara_card_v2',
            spec_version: '2.0',
            data: {
              name: 'Seraphina',
              description: 'Forest guardian',
              first_mes: 'Welcome.',
              tags: ['fantasy'],
              character_version: '1.2',
            },
          }),
          'utf8',
        ),
        { filename: 'seraphina.json', contentType: 'application/json' },
      )
      .expect(201);

    await request(app!.getHttpServer() as App)
      .get('/characters?scope=all&pageIndex=0&pageSize=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        const body = responseBody<SuccessEnvelope<{ items: Array<{ name: string }> }>>(response);
        expect(body.data.items.map((item) => item.name)).toContain('Seraphina');
      });
  });

  it('blocks another user from editing a public character', async () => {
    const ownerToken = await setupAdmin(app!);
    const otherToken = await createUserToken(app!, 'reader');

    const createResponse = await request(app!.getHttpServer() as App)
      .post('/characters')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Public Card', firstMessage: 'Hello', visibility: 'public' })
      .expect(201);
    const id = responseBody<SuccessEnvelope<{ id: string }>>(createResponse).data.id;

    await request(app!.getHttpServer() as App)
      .get(`/characters/${id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);

    await request(app!.getHttpServer() as App)
      .patch(`/characters/${id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ comment: 'edited by another user' })
      .expect(403);
  });

  it('keeps private characters hidden from another user', async () => {
    const ownerToken = await setupAdmin(app!);
    const otherToken = await createUserToken(app!, 'viewer');

    const createResponse = await request(app!.getHttpServer() as App)
      .post('/characters')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Private Card', firstMessage: 'Secret', visibility: 'private' })
      .expect(201);
    const id = responseBody<SuccessEnvelope<{ id: string }>>(createResponse).data.id;

    await request(app!.getHttpServer() as App)
      .get(`/characters/${id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  it('paginates with pageIndex and pageSize', async () => {
    const token = await setupAdmin(app!);

    for (const name of ['A', 'B', 'C']) {
      await request(app!.getHttpServer() as App)
        .post('/characters')
        .set('Authorization', `Bearer ${token}`)
        .send({ name, firstMessage: 'Hello' })
        .expect(201);
    }

    await request(app!.getHttpServer() as App)
      .get('/characters?pageIndex=1&pageSize=2&sort=name&direction=asc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        const body = responseBody<
          SuccessEnvelope<{
            items: Array<{ name: string }>;
            totalItems: number;
            totalPages: number;
          }>
        >(response);
        expect(body.data.items).toHaveLength(1);
        expect(body.data.items[0]?.name).toBe('C');
        expect(body.data.totalItems).toBe(3);
        expect(body.data.totalPages).toBe(2);
      });
  });

  it('exports a visible character as SillyTavern V3 JSON', async () => {
    const token = await setupAdmin(app!);
    const createResponse = await request(app!.getHttpServer() as App)
      .post('/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Exported', firstMessage: 'Hello' })
      .expect(201);
    const id = responseBody<SuccessEnvelope<{ id: string }>>(createResponse).data.id;

    await request(app!.getHttpServer() as App)
      .get(`/characters/${id}/export/sillytavern?version=v3`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          spec: 'chara_card_v3',
          data: { name: 'Exported', first_mes: 'Hello' },
        });
      });
  });
});

async function setupAdmin(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer() as App)
    .post('/auth/setup-admin')
    .send({ username: 'admin', password: 'very-secure-password' })
    .expect(201);

  return responseBody<AuthenticatedUserBody>(response).data.token;
}

async function createUserToken(app: INestApplication, username: string): Promise<string> {
  const db = app.get<Kysely<Database>>(KYSELY_DB, { strict: false });
  const token = `test-token-${username}`;
  const tokenHash = createHash('sha256').update(token, 'utf8').digest('hex');

  await db
    .insertInto('users')
    .values({
      id: `user_${username}`,
      username,
      password_hash: 'scrypt:16384:8:1:placeholder-salt:placeholder-hash-created-for-character-e2e',
      display_name: username,
      role: 'user',
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    })
    .execute();

  await db
    .insertInto('sessions')
    .values({
      id: tokenHash,
      user_id: `user_${username}`,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      created_at: new Date(0).toISOString(),
    })
    .execute();

  return token;
}

function responseBody<TBody>(response: { body: unknown }): TBody {
  return response.body as TBody;
}
