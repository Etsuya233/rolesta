import { describe, expect, it } from "vitest";
import type { ModelProviderApiKeyResponse } from "../api/model-providers-api";
import { sortApiKeys, sortApiKeysByName } from "./model-provider-api-key-sort";

const items: ModelProviderApiKeyResponse[] = [
  { id: "2", name: "Zulu", createdAtMs: 20, updatedAtMs: 30 },
  { id: "1", name: "Alpha", createdAtMs: 10, updatedAtMs: 40 },
  { id: "3", name: "Bravo", createdAtMs: 30, updatedAtMs: 20 },
];

describe("model provider API key sorting", () => {
  it("defaults management ordering to recently updated first", () => {
    expect(sortApiKeys(items, "updatedAtMs", "desc", "en").map(keyName)).toEqual([
      "Alpha",
      "Zulu",
      "Bravo",
    ]);
  });

  it("supports created time and name in both directions", () => {
    expect(sortApiKeys(items, "createdAtMs", "asc", "en").map(keyName)).toEqual([
      "Alpha",
      "Zulu",
      "Bravo",
    ]);
    expect(sortApiKeys(items, "name", "desc", "en").map(keyName)).toEqual([
      "Zulu",
      "Bravo",
      "Alpha",
    ]);
  });

  it("keeps the selection menu A-Z without mutating query data", () => {
    const originalOrder = items.map(keyName);

    expect(sortApiKeysByName(items, "en").map(keyName)).toEqual([
      "Alpha",
      "Bravo",
      "Zulu",
    ]);
    expect(items.map(keyName)).toEqual(originalOrder);
  });
});

function keyName(item: ModelProviderApiKeyResponse): string {
  return item.name;
}
