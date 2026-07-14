import { ApiProperty } from '@nestjs/swagger';
import type { PageResponse } from '@rolesta/shared';
import {
  PRESET_VISIBILITIES,
  type Preset,
  type PresetEntry,
  type PresetEntryPosition,
  type PresetEntryRole,
  type PresetPromptItem,
  type PresetSummary,
  type PresetSourceFormat,
  type PresetVisibility,
} from '../domain/preset.js';
import type { PresetModelSettings } from '../domain/preset-model-settings.js';

export class PresetSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  ownerUserId!: string;

  @ApiProperty({ enum: PRESET_VISIBILITIES })
  visibility!: PresetVisibility;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: Number })
  entryCount!: number;

  @ApiProperty({ type: Number })
  promptItemCount!: number;

  @ApiProperty({ type: Number })
  tokenCount!: number;

  @ApiProperty({ type: Number })
  createdAtMs!: number;

  @ApiProperty({ type: Number })
  updatedAtMs!: number;

  @ApiProperty({ nullable: true, type: Number })
  lastUsedAtMs!: number | null;

  @ApiProperty({ type: Number })
  usageCount!: number;
}

export class PresetModelSettingsResponseDto {
  @ApiProperty({ nullable: true, type: Number })
  contextLength!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  maxResponseLength!: number | null;

  @ApiProperty({ type: Boolean })
  stream!: boolean;

  @ApiProperty({ nullable: true, type: Number })
  temperature!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  presencePenalty!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  frequencyPenalty!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  repetitionPenalty!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  topP!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  topK!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  minP!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  topA!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  seed!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  n!: number | null;

  @ApiProperty({ type: String })
  reasoningEffort!: string;

  @ApiProperty({ type: String })
  verbosity!: string;

  @ApiProperty({ type: Boolean })
  showThoughts!: boolean;
}

export class PresetEntryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  presetId!: string;

  @ApiProperty({ type: String })
  identifier!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ enum: ['system', 'user', 'assistant'] })
  role!: PresetEntryRole;

  @ApiProperty({
    enum: ['system', 'chat', 'preHistory', 'postHistory', 'unknown'],
  })
  position!: PresetEntryPosition;

  @ApiProperty({ type: String })
  content!: string;

  @ApiProperty({ type: Number })
  tokenCount!: number;

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;

  @ApiProperty({ type: Number })
  createdAtMs!: number;

  @ApiProperty({ type: Number })
  updatedAtMs!: number;
}

export class PresetPromptItemResponseDto {
  @ApiProperty({ type: String })
  entryId!: string;

  @ApiProperty({ type: Boolean })
  enabled!: boolean;

  @ApiProperty({ type: Number })
  orderIndex!: number;
}

export class PresetDetailResponseDto extends PresetSummaryResponseDto {
  @ApiProperty({ nullable: true, type: String })
  modelProviderId!: string | null;

  @ApiProperty({ type: PresetModelSettingsResponseDto })
  modelSettings!: PresetModelSettings;

  @ApiProperty({ enum: ['cl100k_base'] })
  tokenizer!: Preset['tokenizer'];

  @ApiProperty({ enum: ['sillytavern_preset', 'rolesta'] })
  sourceFormat!: PresetSourceFormat;

  @ApiProperty({ type: () => [PresetEntryResponseDto] })
  entries!: PresetEntryResponseDto[];

  @ApiProperty({ type: () => [PresetPromptItemResponseDto] })
  promptItems!: PresetPromptItemResponseDto[];
}

export class PresetPageResponseDto {
  @ApiProperty({ type: () => [PresetSummaryResponseDto] })
  items!: PresetSummaryResponseDto[];

  @ApiProperty({ type: Number })
  pageIndex!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  totalItems!: number;

  @ApiProperty({ type: Number })
  totalPages!: number;
}

export function toPresetSummaryResponse(
  preset: PresetSummary,
): PresetSummaryResponseDto {
  return {
    id: preset.id,
    ownerUserId: preset.ownerUserId,
    visibility: preset.visibility,
    name: preset.name,
    entryCount: preset.entryCount,
    promptItemCount: preset.promptItemCount,
    tokenCount: preset.tokenCount,
    createdAtMs: preset.createdAtMs,
    updatedAtMs: preset.updatedAtMs,
    lastUsedAtMs: preset.lastUsedAtMs,
    usageCount: preset.usageCount,
  };
}

export function toPresetDetailResponse(
  preset: Preset,
  viewerUserId: string,
): PresetDetailResponseDto {
  return {
    ...toPresetAggregateSummaryResponse(preset),
    modelProviderId:
      preset.ownerUserId === viewerUserId ? preset.modelProviderId : null,
    modelSettings: preset.modelSettings,
    tokenizer: preset.tokenizer,
    sourceFormat: preset.sourceFormat,
    entries: preset.entries.map(toPresetEntryResponse),
    promptItems: preset.promptItems.map(toPresetPromptItemResponse),
  };
}

function toPresetAggregateSummaryResponse(
  preset: Preset,
): PresetSummaryResponseDto {
  return {
    id: preset.id,
    ownerUserId: preset.ownerUserId,
    visibility: preset.visibility,
    name: preset.name,
    entryCount: preset.entries.length,
    promptItemCount: preset.promptItems.length,
    tokenCount: preset.tokenCount,
    createdAtMs: preset.createdAtMs,
    updatedAtMs: preset.updatedAtMs,
    lastUsedAtMs: preset.lastUsedAtMs,
    usageCount: preset.usageCount,
  };
}

export function toPresetPageResponse(
  page: PageResponse<PresetSummary>,
): PresetPageResponseDto {
  return {
    items: page.items.map(toPresetSummaryResponse),
    pageIndex: page.pageIndex,
    pageSize: page.pageSize,
    totalItems: page.totalItems,
    totalPages: page.totalPages,
  };
}

function toPresetEntryResponse(entry: PresetEntry): PresetEntryResponseDto {
  return {
    id: entry.id,
    presetId: entry.presetId,
    identifier: entry.identifier,
    name: entry.name,
    role: entry.role,
    position: entry.position,
    content: entry.content,
    tokenCount: entry.tokenCount,
    metadata: entry.metadata,
    createdAtMs: entry.createdAtMs,
    updatedAtMs: entry.updatedAtMs,
  };
}

function toPresetPromptItemResponse(
  item: PresetPromptItem,
): PresetPromptItemResponseDto {
  return {
    entryId: item.entryId,
    enabled: item.enabled,
    orderIndex: item.orderIndex,
  };
}
