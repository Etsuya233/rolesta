import { describe, expect, it } from "vitest";
import { createTestDatabase } from "../../../../../packages/db/src/test-utils/create-test-database.js";
import type {
  ApiKey,
  ModelProviderConfig,
} from "../domain/model-provider-config.js";
import { KyselyApiKeyStore } from "./kysely-api-key-store.js";
import { KyselyModelProviderStore } from "./kysely-model-provider-store.js";

describe("KyselyApiKeyStore", () => {
  it("lists providers joined to global API keys without ambiguous filters", async () => {
    const database = await createTestDatabase();
    const apiKeys = new KyselyApiKeyStore(database.db);
    const providers = new KyselyModelProviderStore(database.db);

    try {
      await seedUser(database.db);
      await apiKeys.save(apiKey());
      await providers.save(provider("provider-1"));

      await expect(
        providers.list({
          viewerUserId: "owner",
          sort: "createdAt",
          direction: "desc",
          pageIndex: 0,
          pageSize: 20,
          q: "provider",
        }),
      ).resolves.toMatchObject({
        items: [{ id: "provider-1", apiKeyId: "key", apiKeyName: "Shared" }],
        totalItems: 1,
      });
    } finally {
      await database.destroy();
    }
  });

  it("deletes a key and clears all provider references in one operation", async () => {
    const database = await createTestDatabase();
    const apiKeys = new KyselyApiKeyStore(database.db);
    const providers = new KyselyModelProviderStore(database.db);

    try {
      await seedUser(database.db);
      await apiKeys.save(apiKey());
      await providers.save(provider("provider-1"));
      await providers.save(provider("provider-2"));

      await expect(
        apiKeys.deleteOwnedAndClearProviderReferences("key", "owner", 200),
      ).resolves.toBe(2);
      await expect(apiKeys.findOwnedById("key", "owner")).resolves.toBeNull();
      await expect(
        providers.findOwnedById("provider-1", "owner"),
      ).resolves.toMatchObject({
        credentialMode: "manual",
        secret: "",
        apiKeyId: null,
        apiKeyName: null,
        updatedAtMs: 200,
      });
      await expect(
        providers.findOwnedById("provider-2", "owner"),
      ).resolves.toMatchObject({
        credentialMode: "manual",
        secret: "",
        apiKeyId: null,
        apiKeyName: null,
        updatedAtMs: 200,
      });
    } finally {
      await database.destroy();
    }
  });
});

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>["db"];

async function seedUser(db: TestDatabase): Promise<void> {
  await db
    .insertInto("users")
    .values({
      id: "owner",
      username: "owner",
      password_hash: "unused",
      display_name: "Owner",
      role: "user",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    })
    .execute();
}

function apiKey(): ApiKey {
  return {
    id: "key",
    ownerUserId: "owner",
    name: "Shared",
    secret: "secret",
    createdAtMs: 100,
    updatedAtMs: 100,
  };
}

function provider(id: string): ModelProviderConfig {
  return {
    id,
    ownerUserId: "owner",
    name: id,
    providerKind: "openai-compatible",
    providerSource: "custom",
    baseUrl: "https://example.com/v1",
    defaultModelName: "",
    credentialMode: "vault",
    secret: "",
    apiKeyId: "key",
    apiKeyName: "Shared",
    createdAtMs: 100,
    updatedAtMs: 100,
    lastUsedAtMs: null,
    usageCount: 0,
  };
}
