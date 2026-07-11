import { UseCase } from "../../common/errors/index.js";
import type { ModelProviderKind } from "../domain/model-provider-catalog.js";
import type { ModelProviderConfig } from "../domain/model-provider-config.js";
import type { ModelProviderCredentialMode } from "../domain/model-provider-config.js";
import type { ApiKeyStore } from "../ports/api-key-store.js";
import type { ModelProviderClock } from "./model-provider-application-services.js";
import { ModelProviderApplicationError } from "./model-provider-application-error.js";
import { translateModelProviderError } from "./model-provider-error.mapper.js";
import type { ModelProviderStore } from "../ports/model-provider-store.js";
import {
  sourceForProviderKind,
  validateProviderConnection,
} from "../domain/model-provider-validation.js";

export interface UpdateModelProviderCommand {
  id: string;
  viewerUserId: string;
  name?: string;
  providerKind?: ModelProviderKind;
  baseUrl?: string;
  defaultModelName?: string;
  credentialMode?: ModelProviderCredentialMode;
  secret?: string;
  apiKeyId?: string | null;
}

export class UpdateModelProviderUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly clock: ModelProviderClock,
    private readonly apiKeyStore: ApiKeyStore,
  ) {}

  @UseCase(translateModelProviderError)
  async execute(
    command: UpdateModelProviderCommand,
  ): Promise<ModelProviderConfig> {
    const current = await this.store.findOwnedById(
      command.id,
      command.viewerUserId,
    );

    if (current === null) {
      throw new ModelProviderApplicationError("not-found", {});
    }

    const providerKind = command.providerKind ?? current.providerKind;
    const baseUrl = command.baseUrl ?? current.baseUrl;
    const connection = validateProviderConnection(providerKind, baseUrl);
    const credentialMode = command.credentialMode ?? current.credentialMode;
    const apiKeyId =
      command.apiKeyId === undefined ? current.apiKeyId : command.apiKeyId;
    const apiKey =
      credentialMode === "vault" && apiKeyId
        ? await this.apiKeyStore.findOwnedById(apiKeyId, command.viewerUserId)
        : null;
    if (credentialMode === "vault" && !apiKey)
      throw new ModelProviderApplicationError("api-key-not-owned", {});

    const next: ModelProviderConfig = {
      ...current,
      name: command.name === undefined ? current.name : command.name.trim(),
      providerKind: connection.providerKind,
      providerSource: sourceForProviderKind(connection.providerKind),
      baseUrl: connection.baseUrl,
      defaultModelName:
        command.defaultModelName === undefined
          ? current.defaultModelName
          : command.defaultModelName.trim(),
      credentialMode,
      secret:
        credentialMode === "manual" ? (command.secret ?? current.secret) : "",
      apiKeyId: credentialMode === "vault" ? apiKeyId : null,
      apiKeyName: apiKey?.name ?? null,
      updatedAtMs: this.clock.now().getTime(),
    };

    await this.store.update(next);

    return next;
  }
}
