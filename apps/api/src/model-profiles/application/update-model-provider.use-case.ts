import type { ModelProviderKind } from '../domain/model-provider-catalog.js';
import type { ModelProviderConfig } from '../domain/model-provider-config.js';
import type { ModelProviderClock } from './model-provider-application-services.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import type { ModelProviderStore } from './model-provider-store.js';
import {
  sourceForProviderKind,
  validateProviderConnection,
} from './model-provider-validation.js';

export interface UpdateModelProviderCommand {
  id: string;
  viewerUserId: string;
  name?: string;
  providerKind?: ModelProviderKind;
  baseUrl?: string;
  defaultModelName?: string;
  selectedApiKeyId?: string | null;
}

export class UpdateModelProviderUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly clock: ModelProviderClock,
  ) {}

  async execute(command: UpdateModelProviderCommand): Promise<ModelProviderConfig> {
    const current = await this.store.findOwnedById(command.id, command.viewerUserId);

    if (current === null) {
      throw new ModelProviderApplicationError('not-found');
    }

    const providerKind = command.providerKind ?? current.providerKind;
    const baseUrl = command.baseUrl ?? current.baseUrl;
    const connection = validateProviderConnection(providerKind, baseUrl);
    const selectedApiKeyId =
      command.selectedApiKeyId === undefined ? current.selectedApiKeyId : command.selectedApiKeyId;

    if (
      selectedApiKeyId !== null &&
      !current.apiKeys.some((apiKey) => apiKey.id === selectedApiKeyId)
    ) {
      throw new ModelProviderApplicationError('api-key-not-owned');
    }

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
      selectedApiKeyId,
      updatedAtMs: this.clock.now().getTime(),
    };

    await this.store.update(next);

    return next;
  }
}
