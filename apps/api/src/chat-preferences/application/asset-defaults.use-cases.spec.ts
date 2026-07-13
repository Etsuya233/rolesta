import { describe, expect, it } from "vitest";
import type {
  AssetDefaults,
  AssetDefaultsPatch,
} from "../domain/asset-defaults.js";
import type { AssetDefaultsStore } from "../ports/asset-defaults-store.js";
import type {
  AssetDefaultField,
  ChatAssetOwnership,
} from "../ports/chat-asset-ownership.js";
import {
  ChatPreferencesApplicationError,
  type ChatPreferencesApplicationErrorReason,
} from "./chat-preferences-application-error.js";
import { GetAssetDefaultsUseCase } from "./get-asset-defaults.use-case.js";
import { UpdateAssetDefaultsUseCase } from "./update-asset-defaults.use-case.js";

describe("asset defaults use cases", () => {
  it("returns three null values when the user has not configured defaults", async () => {
    const store = new MemoryAssetDefaultsStore();

    await expect(
      new GetAssetDefaultsUseCase(store).execute("owner"),
    ).resolves.toEqual({
      personaCharacterId: null,
      presetId: null,
      modelProviderId: null,
    });
  });

  it("checks all submitted non-null assets once and returns the complete updated state", async () => {
    const ownership = new StubChatAssetOwnership();
    const store = new MemoryAssetDefaultsStore({
      personaCharacterId: "old-character",
      presetId: null,
      modelProviderId: null,
    });
    const patch = {
      presetId: "preset",
      modelProviderId: "provider",
    } satisfies AssetDefaultsPatch;

    await expect(
      new UpdateAssetDefaultsUseCase(ownership, store).execute("owner", patch),
    ).resolves.toEqual({
      personaCharacterId: "old-character",
      presetId: "preset",
      modelProviderId: "provider",
    });
    expect(ownership.requests).toEqual([{ userId: "owner", patch }]);
    expect(store.updateCalls).toBe(1);
  });

  it("accepts explicit null without an ownership lookup", async () => {
    const ownership = new StubChatAssetOwnership();
    const store = new MemoryAssetDefaultsStore({
      personaCharacterId: "character",
      presetId: null,
      modelProviderId: null,
    });

    await expect(
      new UpdateAssetDefaultsUseCase(ownership, store).execute("owner", {
        personaCharacterId: null,
      }),
    ).resolves.toMatchObject({ personaCharacterId: null });
    expect(ownership.requests).toEqual([]);
  });

  it("rejects an empty patch before checking ownership or writing", async () => {
    const ownership = new StubChatAssetOwnership();
    const store = new MemoryAssetDefaultsStore();

    await expectApplicationError(
      new UpdateAssetDefaultsUseCase(ownership, store).execute("owner", {}),
      "invalid-patch",
    );
    expect(ownership.requests).toEqual([]);
    expect(store.updateCalls).toBe(0);
  });

  it("reports every unavailable field without exposing asset IDs and skips the write", async () => {
    const ownership = new StubChatAssetOwnership([
      "personaCharacterId",
      "presetId",
      "modelProviderId",
    ]);
    const store = new MemoryAssetDefaultsStore();

    const promise = new UpdateAssetDefaultsUseCase(ownership, store).execute(
      "owner",
      {
        personaCharacterId: "public-card-owned-by-someone-else",
        presetId: "missing-preset",
        modelProviderId: "missing-provider",
      },
    );

    await expectApplicationError(promise, "asset-unavailable", {
      fields: ["personaCharacterId", "presetId", "modelProviderId"],
    });
    await promise.catch((error: unknown) => {
      expect(JSON.stringify(error)).not.toContain(
        "public-card-owned-by-someone-else",
      );
      expect(JSON.stringify(error)).not.toContain("missing-preset");
      expect(JSON.stringify(error)).not.toContain("missing-provider");
    });
    expect(store.updateCalls).toBe(0);
  });

  it("keeps repeated updates idempotent", async () => {
    const ownership = new StubChatAssetOwnership();
    const store = new MemoryAssetDefaultsStore();
    const useCase = new UpdateAssetDefaultsUseCase(ownership, store);

    await useCase.execute("owner", { presetId: "preset" });
    await expect(
      useCase.execute("owner", { presetId: "preset" }),
    ).resolves.toMatchObject({
      presetId: "preset",
    });
  });
});

class StubChatAssetOwnership implements ChatAssetOwnership {
  readonly requests: Array<{ userId: string; patch: AssetDefaultsPatch }> = [];

  constructor(private readonly unavailableFields: AssetDefaultField[] = []) {}

  findUnavailableFields(
    userId: string,
    patch: AssetDefaultsPatch,
  ): Promise<AssetDefaultField[]> {
    this.requests.push({ userId, patch });
    return Promise.resolve([...this.unavailableFields]);
  }
}

class MemoryAssetDefaultsStore implements AssetDefaultsStore {
  updateCalls = 0;

  constructor(
    private value: AssetDefaults = {
      personaCharacterId: null,
      presetId: null,
      modelProviderId: null,
    },
  ) {}

  get(userId: string): Promise<AssetDefaults> {
    void userId;
    return Promise.resolve({ ...this.value });
  }

  update(userId: string, patch: AssetDefaultsPatch): Promise<AssetDefaults> {
    void userId;
    this.updateCalls += 1;
    this.value = { ...this.value, ...patch };
    return Promise.resolve({ ...this.value });
  }
}

async function expectApplicationError(
  promise: Promise<unknown>,
  reason: ChatPreferencesApplicationErrorReason,
  params?: Record<string, unknown>,
): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    name: ChatPreferencesApplicationError.name,
    reason,
    ...(params === undefined ? {} : { params }),
  });
}
