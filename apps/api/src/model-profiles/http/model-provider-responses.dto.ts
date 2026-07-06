import { ApiProperty } from '@nestjs/swagger';
import type { PageResponse } from '@rolesta/shared';
import {
  MODEL_PROVIDER_KINDS,
  MODEL_PROVIDER_SOURCES,
  type ModelProviderCatalogItem,
  type ModelProviderKind,
  type ModelProviderSource,
} from '../domain/model-provider-catalog.js';
import type {
  ModelProviderApiKey,
  ModelProviderConfig,
  ModelProviderSummary,
} from '../domain/model-provider-config.js';
import type { ModelProviderModelListResult } from '../application/list-model-provider-models.use-case.js';
import type { TestModelProviderConnectionResult } from '../application/test-model-provider-connection.use-case.js';

export class ModelProviderCatalogItemResponseDto {
  @ApiProperty({ enum: MODEL_PROVIDER_KINDS })
  kind!: ModelProviderKind;

  @ApiProperty({ enum: MODEL_PROVIDER_SOURCES })
  source!: ModelProviderSource;

  @ApiProperty({ type: String })
  displayName!: string;

  @ApiProperty({ type: () => [String] })
  baseUrls!: string[];

  @ApiProperty({ type: Boolean })
  allowCustomBaseUrl!: boolean;
}

export class ModelProviderCatalogResponseDto {
  @ApiProperty({ type: () => [ModelProviderCatalogItemResponseDto] })
  items!: ModelProviderCatalogItemResponseDto[];
}

export class ModelProviderApiKeyResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  configId!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  secret!: string;

  @ApiProperty({ type: Number })
  createdAtMs!: number;

  @ApiProperty({ type: Number })
  updatedAtMs!: number;
}

export class ModelProviderSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  ownerUserId!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ enum: MODEL_PROVIDER_KINDS })
  providerKind!: ModelProviderKind;

  @ApiProperty({ enum: MODEL_PROVIDER_SOURCES })
  providerSource!: ModelProviderSource;

  @ApiProperty({ type: String })
  baseUrl!: string;

  @ApiProperty({ type: String })
  defaultModelName!: string;

  @ApiProperty({ nullable: true, type: String })
  selectedApiKeyId!: string | null;

  @ApiProperty({ type: Number })
  apiKeyCount!: number;

  @ApiProperty({ type: Number })
  createdAtMs!: number;

  @ApiProperty({ type: Number })
  updatedAtMs!: number;

  @ApiProperty({ nullable: true, type: Number })
  lastUsedAtMs!: number | null;

  @ApiProperty({ type: Number })
  usageCount!: number;
}

export class ModelProviderDetailResponseDto extends ModelProviderSummaryResponseDto {
  @ApiProperty({ type: () => [ModelProviderApiKeyResponseDto] })
  apiKeys!: ModelProviderApiKeyResponseDto[];
}

export class ModelProviderPageResponseDto {
  @ApiProperty({ type: () => [ModelProviderSummaryResponseDto] })
  items!: ModelProviderSummaryResponseDto[];

  @ApiProperty({ type: Number })
  pageIndex!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  totalItems!: number;

  @ApiProperty({ type: Number })
  totalPages!: number;
}

export class ModelProviderModelListResponseDto {
  @ApiProperty({ type: () => [String] })
  models!: string[];

  @ApiProperty({ type: Number })
  elapsedMs!: number;
}

export class TestModelProviderConnectionResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: true;

  @ApiProperty({ type: String })
  modelName!: string;

  @ApiProperty({ type: Number })
  elapsedMs!: number;

  @ApiProperty({ nullable: true, type: String })
  remoteResponseId!: string | null;
}

export function toModelProviderCatalogResponse(
  items: readonly ModelProviderCatalogItem[],
): ModelProviderCatalogResponseDto {
  return {
    items: items.map((item) => ({
      kind: item.kind,
      source: item.source,
      displayName: item.displayName,
      baseUrls: [...item.baseUrls],
      allowCustomBaseUrl: item.allowCustomBaseUrl,
    })),
  };
}

export function toModelProviderSummaryResponse(
  config: ModelProviderSummary,
): ModelProviderSummaryResponseDto {
  return {
    id: config.id,
    ownerUserId: config.ownerUserId,
    name: config.name,
    providerKind: config.providerKind,
    providerSource: config.providerSource,
    baseUrl: config.baseUrl,
    defaultModelName: config.defaultModelName,
    selectedApiKeyId: config.selectedApiKeyId,
    apiKeyCount: config.apiKeyCount,
    createdAtMs: config.createdAtMs,
    updatedAtMs: config.updatedAtMs,
    lastUsedAtMs: config.lastUsedAtMs,
    usageCount: config.usageCount,
  };
}

export function toModelProviderDetailResponse(
  config: ModelProviderConfig,
): ModelProviderDetailResponseDto {
  return {
    ...toModelProviderSummaryResponse({
      ...config,
      apiKeyCount: config.apiKeys.length,
    }),
    apiKeys: config.apiKeys.map(toModelProviderApiKeyResponse),
  };
}

export function toModelProviderPageResponse(
  page: PageResponse<ModelProviderSummary>,
): ModelProviderPageResponseDto {
  return {
    items: page.items.map(toModelProviderSummaryResponse),
    pageIndex: page.pageIndex,
    pageSize: page.pageSize,
    totalItems: page.totalItems,
    totalPages: page.totalPages,
  };
}

export function toModelProviderModelListResponse(
  result: ModelProviderModelListResult,
): ModelProviderModelListResponseDto {
  return {
    models: result.models,
    elapsedMs: result.elapsedMs,
  };
}

export function toTestModelProviderConnectionResponse(
  result: TestModelProviderConnectionResult,
): TestModelProviderConnectionResponseDto {
  return {
    ok: result.ok,
    modelName: result.modelName,
    elapsedMs: result.elapsedMs,
    remoteResponseId: result.remoteResponseId,
  };
}

function toModelProviderApiKeyResponse(
  apiKey: ModelProviderApiKey,
): ModelProviderApiKeyResponseDto {
  return {
    id: apiKey.id,
    configId: apiKey.configId,
    name: apiKey.name,
    secret: apiKey.secret,
    createdAtMs: apiKey.createdAtMs,
    updatedAtMs: apiKey.updatedAtMs,
  };
}
