import { describe, expect, it } from "vitest";
import {
  applyAssetDefaults,
  applyOwnedPresetModel,
  editChatTitle,
  emptyCreateChatForm,
  selectChatCharacter,
  selectModelProvider,
  validateChatForm,
} from "./chat-form";

describe("Chat form state", () => {
  it("follows character names until the title is edited", () => {
    let state = selectChatCharacter(emptyCreateChatForm(), "a", "Alice");
    expect(state.title).toBe("Alice");
    state = editChatTitle(state, "Custom");
    state = selectChatCharacter(state, "b", "Bob");
    expect(state.title).toBe("Custom");
  });

  it("keeps manual values when defaults arrive late", () => {
    let state = selectModelProvider(emptyCreateChatForm(), "manual");
    state = applyAssetDefaults(state, {
      personaCharacterId: "persona",
      presetId: "preset",
      modelProviderId: "default",
    });
    expect(state).toMatchObject({
      personaCharacterId: "persona",
      presetId: "preset",
      modelProviderId: "manual",
      modelSource: "manual",
    });
  });

  it("lets an owned preset replace a user default until manual lock", () => {
    let state = applyAssetDefaults(emptyCreateChatForm(), {
      personaCharacterId: null,
      presetId: null,
      modelProviderId: "default",
    });
    state = applyOwnedPresetModel(state, "preset-provider");
    expect(state.modelProviderId).toBe("preset-provider");
    state = selectModelProvider(state, null);
    expect(applyOwnedPresetModel(state, "other").modelProviderId).toBeNull();
  });

  it("reports blank titles without changing form values", () => {
    const state = selectChatCharacter(emptyCreateChatForm(), "character", "Character");
    const result = validateChatForm(editChatTitle(state, ""));
    expect(result.issues).toContainEqual({ field: "title", rule: "required" });
  });
});
