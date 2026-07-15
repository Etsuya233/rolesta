import { createHash } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Database } from "@rolesta/db";
import { ERROR_CODES, I18N_MESSAGE_PREFIX } from "@rolesta/shared";
import type { Kysely } from "kysely";
import request from "supertest";
import type { App } from "supertest/types.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase } from "../../../packages/db/src/test-utils/create-test-database.js";
import { AppModule } from "../src/app.module.js";
import { configureApp } from "../src/configure-app.js";
import { KYSELY_DB } from "../src/database/database.provider.js";

describe("Chats API", () => {
  let app: INestApplication;
  let testDatabase: Awaited<ReturnType<typeof createTestDatabase>>;
  let originalDatabasePath: string | undefined;

  beforeEach(async () => {
    originalDatabasePath = process.env.SQLITE_DATABASE_PATH;
    testDatabase = await createTestDatabase();
    process.env.SQLITE_DATABASE_PATH = testDatabase.databasePath;
    await testDatabase.db.destroy();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleRef.createNestApplication(), {
      corsAllowedOrigins: ["http://localhost:5173"],
      requestBodyLimit: "1mb",
    });
    await app.init();
  });

  afterEach(async () => {
    const db = app.get<Kysely<Database>>(KYSELY_DB, { strict: false });
    await app.close();
    await db.destroy();
    await testDatabase.destroy();
    if (originalDatabasePath === undefined)
      delete process.env.SQLITE_DATABASE_PATH;
    else process.env.SQLITE_DATABASE_PATH = originalDatabasePath;
  });

  it("creates, lists, updates, reads, and deletes owner-scoped Chats", async () => {
    const owner = await setupAdmin(app);
    const other = await createUserToken(app, "other");
    const db = app.get<Kysely<Database>>(KYSELY_DB, { strict: false });
    await seedAssets(db, owner.userId, "mine-", "private");
    await seedAssets(db, other.userId, "public-", "public");

    const created = await request(app.getHttpServer() as App)
      .post("/chats")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "  Shared  Character  ",
        chatCharacterId: "public-character",
        personaCharacterId: "public-character",
        presetId: "public-preset",
        modelProviderId: "mine-provider",
      })
      .expect(201)
      .then(
        (response) =>
          (response.body as { data: ChatDetailBody }).data,
      );

    expect(created).toMatchObject({
      title: "Shared  Character",
      chatCharacter: {
        id: "public-character",
        name: "public-Character",
        avatar: null,
      },
      persona: {
        id: "public-character",
        name: "public-Character",
        avatar: null,
      },
      preset: { id: "public-preset", name: "public-Preset" },
      modelProvider: {
        id: "mine-provider",
        name: "mine-Provider",
        providerKind: "openai-compatible",
        defaultModelName: "model",
      },
    });
    expect(Object.keys(created).sort()).toEqual(
      [
        "chatCharacter",
        "chatCharacterId",
        "createdAtMs",
        "id",
        "modelProvider",
        "modelProviderId",
        "persona",
        "personaCharacterId",
        "preset",
        "presetId",
        "title",
        "updatedAtMs",
      ].sort(),
    );

    await request(app.getHttpServer() as App)
      .get(`/chats/${created.id}`)
      .set("Authorization", `Bearer ${other.token}`)
      .expect(404);

    const page = await request(app.getHttpServer() as App)
      .get(
        "/chats?q=Shared&role=public-character&sort=title&direction=asc&pageIndex=0&pageSize=10",
      )
      .set("Authorization", `Bearer ${owner.token}`)
      .expect(200)
      .then((response) => (response.body as { data: ChatPageBody }).data);
    expect(page).toMatchObject({
      pageIndex: 0,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
    });
    expect(page.items[0]).toEqual({
      id: created.id,
      title: "Shared  Character",
      updatedAtMs: created.updatedAtMs,
      chatCharacter: {
        id: "public-character",
        name: "public-Character",
        avatar: null,
      },
    });

    const updated = await request(app.getHttpServer() as App)
      .patch(`/chats/${created.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Shared  Character",
        personaCharacterId: null,
        presetId: null,
      })
      .expect(200)
      .then(
        (response) =>
          (response.body as { data: ChatDetailBody }).data,
      );
    expect(updated).toMatchObject({
      title: "Shared  Character",
      persona: null,
      preset: null,
    });
    expect(updated.updatedAtMs).toBeGreaterThanOrEqual(created.updatedAtMs);

    await request(app.getHttpServer() as App)
      .delete(`/chats/${created.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .expect(200)
      .expect((response) =>
        expect((response.body as { data: { ok: boolean } }).data).toEqual({
          ok: true,
        }),
      );
    await request(app.getHttpServer() as App)
      .get(`/chats/${created.id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .expect(404);
  });

  it("returns structured Zod issues and one asset error at a time", async () => {
    const owner = await setupAdmin(app);
    const validation = await request(app.getHttpServer() as App)
      .post("/chats")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: " ", extra: "secret" })
      .expect(400);
    expect(validation.body).toEqual({
      code: ERROR_CODES.VALIDATION_FAILED,
      msg: `${I18N_MESSAGE_PREFIX}errors.validationFailed`,
      data: {
        issues: [
          { field: "title", rule: "required" },
          { field: "chatCharacterId", rule: "required" },
          { field: "extra", rule: "unknownField" },
        ],
      },
    });

    const unavailable = await request(app.getHttpServer() as App)
      .post("/chats")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Invalid assets",
        chatCharacterId: "missing-character",
        personaCharacterId: "missing-persona",
        presetId: "missing-preset",
        modelProviderId: "missing-provider",
      })
      .expect(422);
    expect(unavailable.body).toEqual({
      code: ERROR_CODES.VALIDATION_FAILED,
      msg: `${I18N_MESSAGE_PREFIX}errors.chatAssetUnavailable`,
      data: { field: "chatCharacterId" },
    });
    expect(JSON.stringify(unavailable.body)).not.toContain("missing-character");
  });

  it("clears other users references when public assets become private", async () => {
    const viewer = await setupAdmin(app);
    const owner = await createUserToken(app, "asset-owner");
    const db = app.get<Kysely<Database>>(KYSELY_DB, { strict: false });
    await seedAssets(db, owner.userId, "shared-", "public");

    const viewerChat = await createChat(app, viewer.token, {
      title: "Viewer",
      chatCharacterId: "shared-character",
      personaCharacterId: "shared-character",
      presetId: "shared-preset",
    });
    const ownerChat = await createChat(app, owner.token, {
      title: "Owner",
      chatCharacterId: "shared-character",
      personaCharacterId: "shared-character",
      presetId: "shared-preset",
    });

    await request(app.getHttpServer() as App)
      .patch("/characters/shared-character")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ visibility: "private" })
      .expect(200);
    await request(app.getHttpServer() as App)
      .patch("/presets/shared-preset")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ visibility: "private" })
      .expect(200);

    const viewerDetail = await getChat(app, viewer.token, viewerChat.id);
    expect(viewerDetail).toMatchObject({
      chatCharacterId: null,
      personaCharacterId: null,
      presetId: null,
      chatCharacter: null,
      persona: null,
      preset: null,
      updatedAtMs: viewerChat.updatedAtMs,
    });
    const ownerDetail = await getChat(app, owner.token, ownerChat.id);
    expect(ownerDetail).toMatchObject({
      chatCharacterId: "shared-character",
      personaCharacterId: "shared-character",
      presetId: "shared-preset",
    });
  });
});

type ChatDetailBody = {
  id: string;
  title: string;
  chatCharacterId: string | null;
  personaCharacterId: string | null;
  presetId: string | null;
  modelProviderId: string | null;
  createdAtMs: number;
  updatedAtMs: number;
  chatCharacter: unknown;
  persona: unknown;
  preset: unknown;
  modelProvider: unknown;
};
type ChatPageBody = {
  items: Array<{
    id: string;
    title: string;
    updatedAtMs: number;
    chatCharacter: unknown;
  }>;
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

async function setupAdmin(app: INestApplication) {
  const response = await request(app.getHttpServer() as App)
    .post("/auth/setup-admin")
    .send({ username: "admin", password: "very-secure-password" })
    .expect(201);
  const body = response.body as {
    data: { token: string; user: { id: string } };
  };
  return {
    token: body.data.token,
    userId: body.data.user.id,
  };
}

async function createUserToken(app: INestApplication, username: string) {
  const db = app.get<Kysely<Database>>(KYSELY_DB, { strict: false });
  const userId = `user_${username}`;
  const token = `test-token-${username}`;
  const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
  await db
    .insertInto("users")
    .values({
      id: userId,
      username,
      password_hash: "unused",
      display_name: username,
      role: "user",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    })
    .execute();
  await db
    .insertInto("sessions")
    .values({
      id: tokenHash,
      user_id: userId,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      created_at: new Date(0).toISOString(),
    })
    .execute();
  return { token, userId };
}

async function seedAssets(
  db: Kysely<Database>,
  ownerUserId: string,
  prefix: string,
  visibility: "private" | "public",
): Promise<void> {
  await db
    .insertInto("characters")
    .values({
      id: `${prefix}character`,
      owner_user_id: ownerUserId,
      avatar_resource_id: null,
      visibility,
      name: `${prefix}Character`,
      nickname: null,
      comment: "",
      tags_json: "[]",
      version: "",
      creator: null,
      description: "",
      personality: "",
      scenario: "",
      first_message: "",
      alternate_greetings_json: "[]",
      group_only_greetings_json: "[]",
      message_example: "",
      creator_notes: "",
      creator_notes_multilingual_json: "{}",
      system_prompt: "",
      post_history_instructions: "",
      character_book_json: null,
      assets_json: "[]",
      source_json: "[]",
      metadata_json: "{}",
      source_format: "sillytavern_v3",
      source_snapshot_json: "{}",
      created_at_ms: 1,
      updated_at_ms: 1,
      creation_date_ms: null,
      modification_date_ms: null,
      last_used_at_ms: null,
      usage_count: 0,
    })
    .execute();
  await db
    .insertInto("presets")
    .values({
      id: `${prefix}preset`,
      owner_user_id: ownerUserId,
      visibility,
      name: `${prefix}Preset`,
      model_provider_id: null,
      model_settings_json: "{}",
      tokenizer: "cl100k_base",
      source_format: "rolesta",
      source_snapshot_json: "{}",
      created_at_ms: 1,
      updated_at_ms: 1,
      last_used_at_ms: null,
      usage_count: 0,
    })
    .execute();
  await db
    .insertInto("model_provider_configs")
    .values({
      id: `${prefix}provider`,
      owner_user_id: ownerUserId,
      name: `${prefix}Provider`,
      provider_kind: "openai-compatible",
      provider_source: "custom",
      base_url: "https://example.com/v1",
      default_model_name: "model",
      credential_mode: "manual",
      secret: "",
      api_key_id: null,
      created_at_ms: 1,
      updated_at_ms: 1,
      last_used_at_ms: null,
      usage_count: 0,
    })
    .execute();
}

async function createChat(
  app: INestApplication,
  token: string,
  body: Record<string, unknown>,
): Promise<ChatDetailBody> {
  return request(app.getHttpServer() as App)
    .post("/chats")
    .set("Authorization", `Bearer ${token}`)
    .send(body)
    .expect(201)
    .then((response) => (response.body as { data: ChatDetailBody }).data);
}

async function getChat(
  app: INestApplication,
  token: string,
  id: string,
): Promise<ChatDetailBody> {
  return request(app.getHttpServer() as App)
    .get(`/chats/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .then((response) => (response.body as { data: ChatDetailBody }).data);
}
