import type { components } from "../../../lib/api/generated/schema";
import type {
  getAssetDefaults,
  updateAssetDefaults,
} from "./chat-preferences-api";
import { describe, expectTypeOf, it } from "vitest";

describe("chat preferences API types", () => {
  it("uses generated asset default request and response types", () => {
    type Response = components["schemas"]["AssetDefaultsResponseDto"];
    type Patch = components["schemas"]["UpdateAssetDefaultsRequestDto"];

    expectTypeOf<
      Awaited<ReturnType<typeof getAssetDefaults>>
    >().toEqualTypeOf<Response>();
    expectTypeOf<
      Parameters<typeof updateAssetDefaults>[0]
    >().toEqualTypeOf<Patch>();
    expectTypeOf<
      Awaited<ReturnType<typeof updateAssetDefaults>>
    >().toEqualTypeOf<Response>();
  });
});
