import { DEFAULT_ERROR_MESSAGE_KEYS } from "@rolesta/shared";
import { describe, expect, it } from "vitest";
import { resources } from "./resources";

describe("translation resources", () => {
  it("contains translations for every default API error message key", () => {
    for (const resource of Object.values(resources)) {
      for (const messageKey of Object.values(DEFAULT_ERROR_MESSAGE_KEYS)) {
        expect(resource.translation).toHaveProperty(messageKey);
      }
    }
  });

  it("keeps asset, character, and preset translation keys aligned across locales", () => {
    const baseTranslation = resources["en-US"].translation;
    const expectedAssetKeys = translationKeyPaths(baseTranslation.assets);
    const expectedCharacterKeys = translationKeyPaths(
      baseTranslation.characters,
    );
    const expectedPresetKeys = translationKeyPaths(baseTranslation.presets);

    for (const resource of Object.values(resources)) {
      expect(translationKeyPaths(resource.translation.assets)).toEqual(
        expectedAssetKeys,
      );
      expect(translationKeyPaths(resource.translation.characters)).toEqual(
        expectedCharacterKeys,
      );
      expect(translationKeyPaths(resource.translation.presets)).toEqual(
        expectedPresetKeys,
      );
    }
  });
});

function translationKeyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") {
    return [prefix];
  }

  if (!isTranslationTree(value)) {
    return [];
  }

  return Object.keys(value)
    .sort()
    .flatMap((key) =>
      translationKeyPaths(value[key], prefix ? `${prefix}.${key}` : key),
    );
}

function isTranslationTree(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
