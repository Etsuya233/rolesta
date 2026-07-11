import { UseCase } from "../../common/errors/index.js";
import type { ApiKey } from "../domain/model-provider-config.js";
import type { ApiKeyStore } from "../ports/api-key-store.js";
import { translateModelProviderError } from "./model-provider-error.mapper.js";
import type {
  ModelProviderClock,
  ModelProviderIdGenerator,
} from "./model-provider-application-services.js";

export class CreateModelProviderApiKeyUseCase {
  constructor(
    private readonly store: ApiKeyStore,
    private readonly idGenerator: ModelProviderIdGenerator,
    private readonly clock: ModelProviderClock,
  ) {}

  @UseCase(translateModelProviderError)
  async execute(command: {
    ownerUserId: string;
    name: string;
    secret: string;
  }): Promise<ApiKey> {
    const now = this.clock.now().getTime();
    const apiKey: ApiKey = {
      id: this.idGenerator.createId(),
      ownerUserId: command.ownerUserId,
      name: command.name.trim(),
      secret: command.secret,
      createdAtMs: now,
      updatedAtMs: now,
    };
    await this.store.save(apiKey);
    return apiKey;
  }
}
