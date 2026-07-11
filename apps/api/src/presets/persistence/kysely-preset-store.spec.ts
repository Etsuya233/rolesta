import { describe, expect, it } from "vitest";
import { createTestDatabase } from "../../../../../packages/db/src/test-utils/create-test-database.js";
import { createDefaultPresetModelSettings } from "../domain/preset-model-settings.js";
import type { Preset } from "../domain/preset.js";
import { KyselyPresetStore } from "./kysely-preset-store.js";

describe("KyselyPresetStore", () => {
  it("filters visible presets by permission scope", async () => {
    const database = await createTestDatabase();
    const store = new KyselyPresetStore(database.db);

    try {
      await seedUser(database.db, "owner");
      await seedUser(database.db, "other");
      await store.save(
        preset({ id: "mine", ownerUserId: "owner", visibility: "private" }),
      );
      await store.save(
        preset({ id: "public", ownerUserId: "other", visibility: "public" }),
      );
      await store.save(
        preset({ id: "hidden", ownerUserId: "other", visibility: "private" }),
      );

      await expect(listIds(store, "all")).resolves.toEqual(["mine", "public"]);
      await expect(listIds(store, "mine")).resolves.toEqual(["mine"]);
      await expect(listIds(store, "public")).resolves.toEqual(["public"]);
      await expect(store.findVisibleById("public", "owner")).resolves.toMatchObject({
        id: "public",
      });
      await expect(store.findVisibleById("hidden", "owner")).resolves.toBeNull();
    } finally {
      await database.destroy();
    }
  });
});

async function listIds(
  store: KyselyPresetStore,
  scope: "all" | "mine" | "public",
): Promise<string[]> {
  const page = await store.list({
    viewerUserId: "owner",
    scope,
    sort: "name",
    direction: "asc",
    pageIndex: 0,
    pageSize: 20,
    q: "",
  });
  return page.items.map((item) => item.id).sort();
}

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>["db"];

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

function preset(overrides: Partial<Preset>): Preset {
  return {
    id: overrides.id ?? "preset",
    ownerUserId: overrides.ownerUserId ?? "owner",
    visibility: overrides.visibility ?? "private",
    name: overrides.name ?? overrides.id ?? "Preset",
    modelProviderId: null,
    modelSettings: createDefaultPresetModelSettings(),
    tokenizer: "cl100k_base",
    entries: [],
    promptItems: [],
    tokenCount: 0,
    sourceFormat: "rolesta",
    sourceSnapshot: {},
    createdAtMs: 1783090000000,
    updatedAtMs: 1783090000000,
    lastUsedAtMs: null,
    usageCount: 0,
    ...overrides,
  };
}
