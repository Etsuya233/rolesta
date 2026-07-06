import type { ModelProviderConfig } from '../domain/model-provider-config.js';
import type { ModelProviderKind } from '../domain/model-provider-catalog.js';
import type {
  ModelProviderClock,
  ModelProviderIdGenerator,
} from './model-provider-application-services.js';
import { ModelProviderApplicationError } from './model-provider-application-error.js';
import type { ModelProviderStore } from './model-provider-store.js';
import {
  sourceForProviderKind,
  validateProviderConnection,
} from './model-provider-validation.js';

export interface CreateModelProviderCommand {
  ownerUserId: string;
  name: string;
  providerKind: ModelProviderKind;
  baseUrl: string;
  defaultModelName?: string;
  selectedApiKeyId?: string | null;
}

export class CreateModelProviderUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly idGenerator: ModelProviderIdGenerator,
    private readonly clock: ModelProviderClock,
  ) {}

  async execute(command: CreateModelProviderCommand): Promise<ModelProviderConfig> {
    const connection = validateProviderConnection(command.providerKind, command.baseUrl);

    if (command.selectedApiKeyId) {
      throw new ModelProviderApplicationError('api-key-not-owned');
    }

    const now = this.clock.now().getTime();
    const config: ModelProviderConfig = {
      id: this.idGenerator.createId(),
      ownerUserId: command.ownerUserId,
      name: command.name.trim(),
      providerKind: connection.providerKind,
      providerSource: sourceForProviderKind(connection.providerKind),
      baseUrl: connection.baseUrl,
      defaultModelName: command.defaultModelName?.trim() ?? '',
      selectedApiKeyId: command.selectedApiKeyId ?? null,
      apiKeys: [],
      createdAtMs: now,
      updatedAtMs: now,
      lastUsedAtMs: null,
      usageCount: 0,
    };

    await this.store.save(config);

    return config;
  }
}
