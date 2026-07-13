import { UseCase } from "../../common/errors/index.js";
import {
  ASSET_DEFAULT_FIELDS,
  type AssetDefaults,
  type AssetDefaultsPatch,
} from "../domain/asset-defaults.js";
import type { AssetDefaultsStore } from "../ports/asset-defaults-store.js";
import type { ChatAssetOwnership } from "../ports/chat-asset-ownership.js";
import { ChatPreferencesApplicationError } from "./chat-preferences-application-error.js";
import { translateChatPreferencesError } from "./chat-preferences-error.mapper.js";

export class UpdateAssetDefaultsUseCase {
  constructor(
    private readonly ownership: ChatAssetOwnership,
    private readonly store: AssetDefaultsStore,
  ) {}

  @UseCase(translateChatPreferencesError)
  async execute(
    userId: string,
    patch: AssetDefaultsPatch,
  ): Promise<AssetDefaults> {
    const submittedFields = ASSET_DEFAULT_FIELDS.filter(
      (field) => patch[field] !== undefined,
    );

    if (submittedFields.length === 0) {
      throw new ChatPreferencesApplicationError({
        reason: "invalid-patch",
        params: {},
      });
    }

    if (submittedFields.some((field) => patch[field] !== null)) {
      const unavailableFields = await this.ownership.findUnavailableFields(
        userId,
        patch,
      );

      if (unavailableFields.length > 0) {
        throw new ChatPreferencesApplicationError({
          reason: "asset-unavailable",
          params: { fields: unavailableFields },
        });
      }
    }

    return this.store.update(userId, patch);
  }
}
