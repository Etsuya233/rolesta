import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PageResponse } from '@rolesta/shared';
import {
  PRESET_ENTRY_ROLES,
  PRESET_GENERATION_TYPES,
  PRESET_SYSTEM_ITEM_KEYS,
  PRESET_SLOTS,
  PRESET_SYSTEM_PROMPTS,
  PRESET_VISIBILITIES,
  type Preset,
  type PresetContentSlotItem,
  type PresetEntry,
  type PresetGenerationType,
  type PresetPromptItem,
  type PresetSlotItem,
  type PresetSourceFormat,
  type PresetSummary,
  type PresetSystemItemKey,
  type PresetSlot,
  type PresetSystemPrompt,
  type PresetVisibility,
} from '../domain/preset.js';
import type { PresetModelSettings } from '../domain/preset-model-settings.js';
import {
  PRESET_IMPORT_ISSUE_REASONS,
  type PresetImportIssueReason,
} from '../ports/preset-codec.js';

export class PresetSummaryResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) ownerUserId!: string;
  @ApiProperty({ enum: PRESET_VISIBILITIES }) visibility!: PresetVisibility;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: Number }) entryCount!: number;
  @ApiProperty({ type: Number }) promptItemCount!: number;
  @ApiProperty({ type: Number }) tokenCount!: number;
  @ApiProperty({ type: Number }) createdAtMs!: number;
  @ApiProperty({ type: Number }) updatedAtMs!: number;
  @ApiProperty({ nullable: true, type: Number }) lastUsedAtMs!: number | null;
  @ApiProperty({ type: Number }) usageCount!: number;
}

export class PresetModelSettingsResponseDto {
  @ApiProperty({ nullable: true, type: Number }) contextLength!: number | null;
  @ApiProperty({ nullable: true, type: Number }) maxResponseLength!: number | null;
  @ApiProperty({ type: Boolean }) stream!: boolean;
  @ApiProperty({ nullable: true, type: Number }) temperature!: number | null;
  @ApiProperty({ nullable: true, type: Number }) presencePenalty!: number | null;
  @ApiProperty({ nullable: true, type: Number }) frequencyPenalty!: number | null;
  @ApiProperty({ nullable: true, type: Number }) repetitionPenalty!: number | null;
  @ApiProperty({ nullable: true, type: Number }) topP!: number | null;
  @ApiProperty({ nullable: true, type: Number }) topK!: number | null;
  @ApiProperty({ nullable: true, type: Number }) minP!: number | null;
  @ApiProperty({ nullable: true, type: Number }) topA!: number | null;
  @ApiProperty({ nullable: true, type: Number }) seed!: number | null;
  @ApiProperty({ nullable: true, type: Number }) n!: number | null;
  @ApiProperty({ type: String }) reasoningEffort!: string;
  @ApiProperty({ type: String }) verbosity!: string;
  @ApiProperty({ type: Boolean }) showThoughts!: boolean;
}

export class PresetPromptPlacementResponseDto {
  @ApiProperty({ enum: ['relative', 'inChat'] }) kind!: 'relative' | 'inChat';
  @ApiPropertyOptional({ nullable: true, type: Number }) depth?: number;
  @ApiPropertyOptional({ nullable: true, type: Number }) order?: number;
}

export class PresetEntryResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) presetId!: string;
  @ApiProperty({ type: String }) identifier!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ enum: PRESET_ENTRY_ROLES }) role!: PresetEntry['role'];
  @ApiProperty({ type: PresetPromptPlacementResponseDto }) placement!: PresetEntry['placement'];
  @ApiProperty({ enum: PRESET_GENERATION_TYPES, isArray: true })
  generationTypes!: PresetGenerationType[];
  @ApiProperty({ type: String }) content!: string;
  @ApiProperty({ type: Number }) tokenCount!: number;
  @ApiProperty({ type: Object }) metadata!: Record<string, unknown>;
  @ApiProperty({ type: Number }) createdAtMs!: number;
  @ApiProperty({ type: Number }) updatedAtMs!: number;
}

export class PresetPromptItemResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ enum: ['slot', 'systemPrompt', 'customPrompt'] }) kind!: PresetPromptItem['kind'];
  @ApiProperty({ type: Boolean }) enabled!: boolean;
  @ApiProperty({ type: Number }) orderIndex!: number;
  @ApiPropertyOptional({ enum: PRESET_SLOTS }) slot?: PresetSlot;
  @ApiPropertyOptional({ enum: PRESET_SYSTEM_PROMPTS }) systemPrompt?: PresetSystemPrompt;
  @ApiPropertyOptional({ type: String }) entryId?: string;
  @ApiPropertyOptional({ type: String }) name?: string;
  @ApiPropertyOptional({ enum: PRESET_ENTRY_ROLES }) role?: PresetEntry['role'];
  @ApiPropertyOptional({ type: PresetPromptPlacementResponseDto })
  placement?: PresetEntry['placement'];
  @ApiPropertyOptional({ enum: PRESET_GENERATION_TYPES, isArray: true })
  generationTypes?: PresetGenerationType[];
  @ApiPropertyOptional({ type: String }) content?: string;
  @ApiPropertyOptional({ type: Boolean }) allowCharacterOverride?: boolean;
  @ApiPropertyOptional({ type: Number }) tokenCount?: number;
}

export class PresetImportIssueResponseDto {
  @ApiProperty({ type: String }) identifier!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ enum: PRESET_IMPORT_ISSUE_REASONS }) reason!: PresetImportIssueReason;
}

export class PresetDetailResponseDto extends PresetSummaryResponseDto {
  @ApiProperty({ nullable: true, type: String }) modelProviderId!: string | null;
  @ApiProperty({ type: PresetModelSettingsResponseDto }) modelSettings!: PresetModelSettings;
  @ApiProperty({ enum: ['cl100k_base'] }) tokenizer!: Preset['tokenizer'];
  @ApiProperty({ enum: ['sillytavern_preset', 'rolesta'] }) sourceFormat!: PresetSourceFormat;
  @ApiProperty({ type: () => [PresetEntryResponseDto] }) entries!: PresetEntryResponseDto[];
  @ApiProperty({ type: () => [PresetPromptItemResponseDto] })
  promptItems!: PresetPromptItemResponseDto[];
}

export class PresetImportResponseDto {
  @ApiProperty({ type: () => PresetDetailResponseDto }) preset!: PresetDetailResponseDto;
  @ApiProperty({ type: () => [PresetImportIssueResponseDto] })
  issues!: PresetImportIssueResponseDto[];
  @ApiProperty({ enum: PRESET_SYSTEM_ITEM_KEYS, isArray: true })
  supplementedItems!: PresetSystemItemKey[];
}

export class PresetPageResponseDto {
  @ApiProperty({ type: () => [PresetSummaryResponseDto] }) items!: PresetSummaryResponseDto[];
  @ApiProperty({ type: Number }) pageIndex!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) totalItems!: number;
  @ApiProperty({ type: Number }) totalPages!: number;
}

export function toPresetSummaryResponse(preset: PresetSummary): PresetSummaryResponseDto {
  return { ...preset };
}

export function toPresetDetailResponse(
  preset: Preset,
  viewerUserId: string,
): PresetDetailResponseDto {
  return {
    ...toPresetAggregateSummaryResponse(preset),
    modelProviderId: preset.ownerUserId === viewerUserId ? preset.modelProviderId : null,
    modelSettings: preset.modelSettings,
    tokenizer: preset.tokenizer,
    sourceFormat: preset.sourceFormat,
    entries: preset.entries.map(toPresetEntryResponse),
    promptItems: preset.promptItems.map(toPresetPromptItemResponse),
  };
}

function toPresetAggregateSummaryResponse(preset: Preset): PresetSummaryResponseDto {
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

export function toPresetPageResponse(page: PageResponse<PresetSummary>): PresetPageResponseDto {
  return {
    items: page.items.map(toPresetSummaryResponse),
    pageIndex: page.pageIndex,
    pageSize: page.pageSize,
    totalItems: page.totalItems,
    totalPages: page.totalPages,
  };
}

function toPresetEntryResponse(entry: PresetEntry): PresetEntryResponseDto {
  return { ...entry };
}

function toPresetPromptItemResponse(item: PresetPromptItem): PresetPromptItemResponseDto {
  if (item.kind === 'customPrompt') {
    return {
      id: item.id,
      kind: item.kind,
      enabled: item.enabled,
      orderIndex: item.orderIndex,
      entryId: item.entryId,
    };
  }
  if (item.kind === 'systemPrompt') {
    const response = {
      id: item.id,
      kind: item.kind,
      enabled: item.enabled,
      orderIndex: item.orderIndex,
      systemPrompt: item.systemPrompt,
      name: item.name,
      role: item.role,
      content: item.content,
      placement: item.placement,
      generationTypes: item.generationTypes,
      tokenCount: item.tokenCount,
    };
    return item.allowCharacterOverride === undefined
      ? response
      : { ...response, allowCharacterOverride: item.allowCharacterOverride };
  }
  return {
    id: item.id,
    kind: item.kind,
    enabled: item.enabled,
    orderIndex: item.orderIndex,
    slot: item.slot,
    ...(isContentSlot(item)
      ? {
          role: item.role,
          placement: item.placement,
          generationTypes: item.generationTypes,
        }
      : {}),
  };
}

function isContentSlot(item: PresetSlotItem): item is PresetContentSlotItem {
  return 'role' in item;
}
