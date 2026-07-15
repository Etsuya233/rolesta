import { describe, expect, it } from "vitest";
import {
  createChatInputSchema,
  listChatsQuerySchema,
  updateChatInputSchema,
} from "./chat-validation.js";
import { validationIssuesFromZodError } from "./validation.js";

describe("Chat request validation", () => {
  it("trims a valid title while preserving internal whitespace", () => {
    expect(
      createChatInputSchema.parse({
        title: "  My  Chat  ",
        chatCharacterId: "character-1",
      }),
    ).toEqual({
      title: "My  Chat",
      chatCharacterId: "character-1",
    });
  });

  it.each([
    [
      { chatCharacterId: "character-1" },
      [{ field: "title", rule: "required" }],
    ],
    [
      { title: "   ", chatCharacterId: "character-1" },
      [{ field: "title", rule: "required" }],
    ],
    [
      { title: "x".repeat(513), chatCharacterId: "character-1" },
      [{ field: "title", rule: "maxLength" }],
    ],
  ])("rejects invalid create titles", (input, expectedIssues) => {
    const result = createChatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(validationIssuesFromZodError(result.error)).toEqual(expectedIssues);
  });

  it("rejects empty patches and explicit null dialogue characters", () => {
    const empty = updateChatInputSchema.safeParse({});
    const nullCharacter = updateChatInputSchema.safeParse({
      chatCharacterId: null,
    });

    expect(empty.success).toBe(false);
    expect(nullCharacter.success).toBe(false);
    if (!empty.success) {
      expect(validationIssuesFromZodError(empty.error)).toEqual([
        { field: "$", rule: "atLeastOne" },
      ]);
    }
    if (!nullCharacter.success) {
      expect(validationIssuesFromZodError(nullCharacter.error)).toEqual([
        { field: "chatCharacterId", rule: "invalidType" },
      ]);
    }
  });

  it("applies list defaults and coerces pagination values", () => {
    expect(
      listChatsQuerySchema.parse({ pageIndex: "2", pageSize: "50" }),
    ).toEqual({
      q: "",
      role: "all",
      sort: "updatedAt",
      direction: "desc",
      pageIndex: 2,
      pageSize: 50,
    });
  });
});
