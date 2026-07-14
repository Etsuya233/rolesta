import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Database } from "@rolesta/db";
import {
  ERROR_CODES,
  I18N_MESSAGE_PREFIX,
  type API_SUCCESS_CODE,
} from "@rolesta/shared";
import type { Kysely } from "kysely";
import request from "supertest";
import type { App } from "supertest/types.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase } from "../../../packages/db/src/test-utils/create-test-database.js";
import { AppModule } from "../src/app.module.js";
import { ChatPreferencesApplicationError } from "../src/chat-preferences/application/chat-preferences-application-error.js";
import { UpdateAssetDefaultsUseCase } from "../src/chat-preferences/application/update-asset-defaults.use-case.js";
import { configureApp } from "../src/configure-app.js";
import { KYSELY_DB } from "../src/database/database.provider.js";

type SuccessEnvelope<TData> = {
  code: typeof API_SUCCESS_CODE;
  msg: string;
  data: TData;
};

type AssetDefaultsBody = SuccessEnvelope<{
  personaCharacterId: string | null;
  presetId: string | null;
  modelProviderId: string | null;
}>;

describe("Chat preferences API", () => {
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
    app = configureApp(moduleRef.createNestApplication(), {
      corsAllowedOrigins: ["http://localhost:5173"],
      requestBodyLimit: "1mb",
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

  it("requires authentication and returns null defaults before configuration", async () => {
    await request(app!.getHttpServer() as App)
      .get("/chat-preferences/assets")
      .expect(401);
    const auth = await setupAdmin(app!);

    await request(app!.getHttpServer() as App)
      .get("/chat-preferences/assets")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200)
      .expect((response) => {
        expect(responseBody<AssetDefaultsBody>(response).data).toEqual({
          personaCharacterId: null,
          presetId: null,
          modelProviderId: null,
        });
      });
  });

  it("patches independently owned defaults and returns the complete preference", async () => {
    const auth = await setupAdmin(app!);
    const db = app!.get<Kysely<Database>>(KYSELY_DB, { strict: false });
    await seedAssets(db, auth.userId);

    await request(app!.getHttpServer() as App)
      .patch("/chat-preferences/assets")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ personaCharacterId: "character", presetId: "preset" })
      .expect(200)
      .expect((response) => {
        expect(responseBody<AssetDefaultsBody>(response).data).toEqual({
          personaCharacterId: "character",
          presetId: "preset",
          modelProviderId: null,
        });
      });

    await request(app!.getHttpServer() as App)
      .patch("/chat-preferences/assets")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ modelProviderId: "provider", presetId: null })
      .expect(200)
      .expect((response) => {
        expect(responseBody<AssetDefaultsBody>(response).data).toEqual({
          personaCharacterId: "character",
          presetId: null,
          modelProviderId: "provider",
        });
      });
  });

  it("clears defaults and orphans the avatar when owned assets are deleted", async () => {
    const auth = await setupAdmin(app!);
    const db = app!.get<Kysely<Database>>(KYSELY_DB, { strict: false });
    await seedAssets(db, auth.userId);
    await seedCharacterAvatar(db, auth.userId, "avatar", "active");
    await db
      .updateTable("characters")
      .set({ avatar_resource_id: "avatar" })
      .where("id", "=", "character")
      .execute();
    await request(app!.getHttpServer() as App)
      .patch("/chat-preferences/assets")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({
        personaCharacterId: "character",
        presetId: "preset",
        modelProviderId: "provider",
      })
      .expect(200);

    await request(app!.getHttpServer() as App)
      .delete("/characters/character")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);
    await expect(
      db
        .selectFrom("file_resources")
        .select(["status", "orphaned_at_ms"])
        .where("id", "=", "avatar")
        .executeTakeFirst(),
    ).resolves.toMatchObject({ status: "orphaned" });
    await expectAssetDefaults(app!, auth.token, {
      personaCharacterId: null,
      presetId: "preset",
      modelProviderId: "provider",
    });

    await request(app!.getHttpServer() as App)
      .delete("/presets/preset")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);
    await request(app!.getHttpServer() as App)
      .delete("/model-providers/provider")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);
    await expectAssetDefaults(app!, auth.token, {
      personaCharacterId: null,
      presetId: null,
      modelProviderId: null,
    });
  }, 15_000);

  it("rolls back avatar removal when the file lifecycle rejects its state", async () => {
    const auth = await setupAdmin(app!);
    const db = app!.get<Kysely<Database>>(KYSELY_DB, { strict: false });
    await seedAssets(db, auth.userId);
    await seedCharacterAvatar(db, auth.userId, "pending-avatar", "pending");
    await db
      .updateTable("characters")
      .set({ avatar_resource_id: "pending-avatar" })
      .where("id", "=", "character")
      .execute();

    await request(app!.getHttpServer() as App)
      .delete("/characters/character/avatar")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(409);

    await expect(
      db
        .selectFrom("characters")
        .select("avatar_resource_id")
        .where("id", "=", "character")
        .executeTakeFirst(),
    ).resolves.toEqual({ avatar_resource_id: "pending-avatar" });
    await expect(
      db
        .selectFrom("file_resources")
        .select(["status", "orphaned_at_ms"])
        .where("id", "=", "pending-avatar")
        .executeTakeFirst(),
    ).resolves.toEqual({ status: "pending", orphaned_at_ms: null });
  });

  it("rejects empty and malformed patches", async () => {
    const auth = await setupAdmin(app!);

    await request(app!.getHttpServer() as App)
      .patch("/chat-preferences/assets")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({})
      .expect(400);
    await request(app!.getHttpServer() as App)
      .patch("/chat-preferences/assets")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ presetId: 123 })
      .expect(400);
  });

  it("reports all unavailable fields without returning asset IDs", async () => {
    const owner = await setupAdmin(app!);
    const db = app!.get<Kysely<Database>>(KYSELY_DB, { strict: false });
    await seedUser(db, "other");
    await seedAssets(db, "other", "other-");
    const submittedIds = ["other-character", "other-preset", "other-provider"];

    const response = await request(app!.getHttpServer() as App)
      .patch("/chat-preferences/assets")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        personaCharacterId: submittedIds[0],
        presetId: submittedIds[1],
        modelProviderId: submittedIds[2],
      })
      .expect(404);

    expect(response.body).toEqual({
      code: ERROR_CODES.NOT_FOUND,
      msg: `${I18N_MESSAGE_PREFIX}errors.assetUnavailable`,
      data: {
        fields: ["personaCharacterId", "presetId", "modelProviderId"],
      },
    });
    for (const id of submittedIds) {
      expect(JSON.stringify(response.body)).not.toContain(id);
    }
  });
});

describe("Chat preferences conflict HTTP mapping", () => {
  it("returns a 409 error envelope for an upsert conflict", async () => {
    const testDatabase = await createTestDatabase();
    const originalDatabasePath = process.env.SQLITE_DATABASE_PATH;
    process.env.SQLITE_DATABASE_PATH = testDatabase.databasePath;
    await testDatabase.db.destroy();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(UpdateAssetDefaultsUseCase)
      .useValue({
        execute: () => {
          throw new ChatPreferencesApplicationError({
            reason: "asset-defaults-conflict",
            params: {},
          });
        },
      })
      .compile();
    const app = configureApp(moduleRef.createNestApplication(), {
      corsAllowedOrigins: ["http://localhost:5173"],
      requestBodyLimit: "1mb",
    });
    await app.init();

    try {
      const auth = await setupAdmin(app);
      await request(app.getHttpServer())
        .patch("/chat-preferences/assets")
        .set("Authorization", `Bearer ${auth.token}`)
        .send({ presetId: "preset" })
        .expect(409)
        .expect({
          code: ERROR_CODES.VALIDATION_FAILED,
          msg: `${I18N_MESSAGE_PREFIX}errors.assetDefaultsConflict`,
          data: {},
        });
    } finally {
      const db = app.get<Kysely<Database>>(KYSELY_DB, { strict: false });
      await app.close();
      await db.destroy();
      await testDatabase.destroy();
      if (originalDatabasePath === undefined) {
        delete process.env.SQLITE_DATABASE_PATH;
      } else {
        process.env.SQLITE_DATABASE_PATH = originalDatabasePath;
      }
    }
  });
});

async function setupAdmin(
  app: INestApplication,
): Promise<{ token: string; userId: string }> {
  const response = await request(app.getHttpServer() as App)
    .post("/auth/setup-admin")
    .send({ username: "admin", password: "very-secure-password" })
    .expect(201);
  const body =
    responseBody<SuccessEnvelope<{ token: string; user: { id: string } }>>(
      response,
    );
  return { token: body.data.token, userId: body.data.user.id };
}

type TestDatabase = Kysely<Database>;

async function seedUser(db: TestDatabase, id: string): Promise<void> {
  await db
    .insertInto("users")
    .values({
      id,
      username: id,
      password_hash: "unused",
      display_name: id,
      role: "user",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    })
    .execute();
}

async function seedAssets(
  db: TestDatabase,
  ownerUserId: string,
  prefix = "",
): Promise<void> {
  await db
    .insertInto("characters")
    .values({
      id: `${prefix}character`,
      owner_user_id: ownerUserId,
      avatar_resource_id: null,
      visibility: prefix ? "public" : "private",
      name: "Character",
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
      visibility: prefix ? "public" : "private",
      name: "Preset",
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
      name: "Provider",
      provider_kind: "openai-compatible",
      provider_source: "custom",
      base_url: "https://example.com/v1",
      default_model_name: "",
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

async function seedCharacterAvatar(
  db: TestDatabase,
  ownerUserId: string,
  id: string,
  status: "pending" | "active",
): Promise<void> {
  await db
    .insertInto("file_resources")
    .values({
      id,
      owner_user_id: ownerUserId,
      purpose: "character-avatar",
      status,
      orphaned_at_ms: null,
      created_at_ms: 1,
    })
    .execute();
}

async function expectAssetDefaults(
  app: INestApplication,
  token: string,
  expected: AssetDefaultsBody["data"],
): Promise<void> {
  await request(app.getHttpServer() as App)
    .get("/chat-preferences/assets")
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .expect((response) => {
      expect(responseBody<AssetDefaultsBody>(response).data).toEqual(expected);
    });
}

function responseBody<TBody>(response: { body: unknown }): TBody {
  return response.body as TBody;
}
