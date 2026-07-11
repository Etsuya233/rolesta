import { UseCase } from "../../common/errors/index.js";
import type { ApiKeyStore } from "../ports/api-key-store.js";
import { ModelProviderApplicationError } from "./model-provider-application-error.js";
import type { ModelProviderClock } from "./model-provider-application-services.js";
import { translateModelProviderError } from "./model-provider-error.mapper.js";

export class DeleteModelProviderApiKeyUseCase {
  constructor(
    private readonly store: ApiKeyStore,
    private readonly clock: ModelProviderClock,
  ) {}

  @UseCase(translateModelProviderError)
  async referenceCount(command: {
    apiKeyId: string;
    ownerUserId: string;
  }): Promise<number> {
    const key = await this.store.findOwnedById(
      command.apiKeyId,
      command.ownerUserId,
    );
    if (!key) throw new ModelProviderApplicationError("not-found", {});
    return this.store.countProviderReferences(
      command.apiKeyId,
      command.ownerUserId,
    );
  }

  @UseCase(translateModelProviderError)
  async execute(command: {
    apiKeyId: string;
    ownerUserId: string;
  }): Promise<{ affectedProviderCount: number }> {
    const count = await this.store.deleteOwnedAndClearProviderReferences(
      command.apiKeyId,
      command.ownerUserId,
      this.clock.now().getTime(),
    );
    if (count === null)
      throw new ModelProviderApplicationError("not-found", {});
    return { affectedProviderCount: count };
  }
}
