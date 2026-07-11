import { UseCase } from "../../common/errors/index.js";
import type { ModelProviderConfig } from "../domain/model-provider-config.js";
import type { ModelProviderKind } from "../domain/model-provider-catalog.js";
import type { ModelProviderCredentialMode } from "../domain/model-provider-config.js";
import type { ApiKeyStore } from "../ports/api-key-store.js";
import type {
  ModelProviderClock,
  ModelProviderIdGenerator,
} from "./model-provider-application-services.js";
import { ModelProviderApplicationError } from "./model-provider-application-error.js";
import { translateModelProviderError } from "./model-provider-error.mapper.js";
import type { ModelProviderStore } from "../ports/model-provider-store.js";
import {
  sourceForProviderKind,
  validateProviderConnection,
} from "../domain/model-provider-validation.js";

export interface CreateModelProviderCommand {
  ownerUserId: string;
  name: string;
  providerKind: ModelProviderKind;
  baseUrl: string;
  defaultModelName?: string;
  credentialMode: ModelProviderCredentialMode;
  secret?: string;
  apiKeyId?: string | null;
}

export class CreateModelProviderUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly idGenerator: ModelProviderIdGenerator,
    private readonly clock: ModelProviderClock,
    private readonly apiKeyStore: ApiKeyStore,
  ) {}

  @UseCase(translateModelProviderError)
  async execute(
    command: CreateModelProviderCommand,
  ): Promise<ModelProviderConfig> {
    const connection = validateProviderConnection(
      command.providerKind,
      command.baseUrl,
    );

    const apiKey =
      command.credentialMode === "vault" && command.apiKeyId
        ? await this.apiKeyStore.findOwnedById(
            command.apiKeyId,
            command.ownerUserId,
          )
        : null;
    if (command.credentialMode === "vault" && !apiKey)
      throw new ModelProviderApplicationError("api-key-not-owned", {});

    const now = this.clock.now().getTime();
    const config: ModelProviderConfig = {
      id: this.idGenerator.createId(),
      ownerUserId: command.ownerUserId,
      name: command.name.trim(),
      providerKind: connection.providerKind,
      providerSource: sourceForProviderKind(connection.providerKind),
      baseUrl: connection.baseUrl,
      defaultModelName: command.defaultModelName?.trim() ?? "",
      credentialMode: command.credentialMode,
      secret: command.credentialMode === "manual" ? (command.secret ?? "") : "",
      apiKeyId:
        command.credentialMode === "vault" ? (command.apiKeyId ?? null) : null,
      apiKeyName: apiKey?.name ?? null,
      createdAtMs: now,
      updatedAtMs: now,
      lastUsedAtMs: null,
      usageCount: 0,
    };

    await this.store.save(config);

    return config;
  }
}
