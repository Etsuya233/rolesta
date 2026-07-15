import { expectTypeOf, it } from "vitest";
import type { components } from "../../../lib/api/generated/schema";
import type { createChat, getChat, listChats, updateChat } from "./chats-api";

it("uses the generated Chat contract", () => {
  expectTypeOf<Awaited<ReturnType<typeof getChat>>>().toEqualTypeOf<
    components["schemas"]["ChatDetailResponseDto"]
  >();
  expectTypeOf<Awaited<ReturnType<typeof listChats>>>().toEqualTypeOf<
    components["schemas"]["ChatPageResponseDto"]
  >();
  expectTypeOf<Awaited<ReturnType<typeof createChat>>>().toEqualTypeOf<
    Awaited<ReturnType<typeof updateChat>>
  >();
});
