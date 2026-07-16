import { ApiProperty } from '@nestjs/swagger';
import type { PageResponse } from '@rolesta/shared';
import type {
  Worldbook,
  WorldbookEntryRole,
  WorldbookEntry,
  WorldbookGenerationTrigger,
  WorldbookInsertionPosition,
  WorldbookSelectiveLogic,
  WorldbookSourceFormat,
  WorldbookSummary,
  WorldbookVisibility,
} from '../domain/worldbook.js';
import {
  WORLDBOOK_ENTRY_ROLES,
  WORLDBOOK_GENERATION_TRIGGERS,
  WORLDBOOK_INSERTION_POSITIONS,
  WORLDBOOK_SELECTIVE_LOGICS,
} from '../domain/worldbook.js';

export class WorldbookSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  ownerUserId!: string;

  @ApiProperty({ enum: ['private', 'public'] })
  visibility!: WorldbookVisibility;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  description!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ type: Number })
  entryCount!: number;

  @ApiProperty({ type: Number })
  enabledEntryCount!: number;

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

export class WorldbookEntryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  worldbookId!: string;

  @ApiProperty({ type: Boolean })
  enabled!: boolean;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  comment!: string;

  @ApiProperty({ type: String })
  content!: string;

  @ApiProperty({ type: [String] })
  primaryKeys!: string[];

  @ApiProperty({ type: [String] })
  secondaryKeys!: string[];

  @ApiProperty({ type: Boolean })
  selective!: boolean;

  @ApiProperty({ enum: WORLDBOOK_SELECTIVE_LOGICS })
  selectiveLogic!: WorldbookSelectiveLogic;

  @ApiProperty({ type: Boolean })
  constant!: boolean;

  @ApiProperty({ type: Boolean })
  vectorized!: boolean;

  @ApiProperty({ type: Boolean })
  ignoreBudget!: boolean;

  @ApiProperty({ type: Boolean })
  useProbability!: boolean;

  @ApiProperty({ nullable: true, type: Boolean })
  caseSensitive!: boolean | null;

  @ApiProperty({ nullable: true, type: Boolean })
  matchWholeWords!: boolean | null;

  @ApiProperty({ type: Boolean })
  matchPersonaDescription!: boolean;

  @ApiProperty({ type: Boolean })
  matchCharacterDescription!: boolean;

  @ApiProperty({ type: Boolean })
  matchCharacterPersonality!: boolean;

  @ApiProperty({ type: Boolean })
  matchCharacterDepthPrompt!: boolean;

  @ApiProperty({ type: Boolean })
  matchScenario!: boolean;

  @ApiProperty({ type: Boolean })
  matchCreatorNotes!: boolean;

  @ApiProperty({ enum: WORLDBOOK_INSERTION_POSITIONS })
  insertionPosition!: WorldbookInsertionPosition;

  @ApiProperty({ type: Number })
  insertionOrder!: number;

  @ApiProperty({ type: Number })
  displayIndex!: number;

  @ApiProperty({ type: Number })
  depth!: number;

  @ApiProperty({ enum: WORLDBOOK_ENTRY_ROLES })
  insertionRole!: WorldbookEntryRole;

  @ApiProperty({ type: String })
  anchorName!: string;

  @ApiProperty({ nullable: true, type: Number })
  scanDepth!: number | null;

  @ApiProperty({ type: Boolean })
  excludeRecursion!: boolean;

  @ApiProperty({ type: Boolean })
  preventRecursion!: boolean;

  @ApiProperty({ type: Number })
  delayUntilRecursion!: number;

  @ApiProperty({ type: String })
  group!: string;

  @ApiProperty({ type: Boolean })
  groupOverride!: boolean;

  @ApiProperty({ type: Number })
  groupWeight!: number;

  @ApiProperty({ nullable: true, type: Boolean })
  useGroupScoring!: boolean | null;

  @ApiProperty({ nullable: true, type: Number })
  sticky!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  cooldown!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  delay!: number | null;

  @ApiProperty({ type: [String] })
  characterFilterNames!: string[];

  @ApiProperty({ type: [String] })
  characterFilterTags!: string[];

  @ApiProperty({ type: Boolean })
  characterFilterExclude!: boolean;

  @ApiProperty({ enum: WORLDBOOK_GENERATION_TRIGGERS, isArray: true })
  triggers!: WorldbookGenerationTrigger[];

  @ApiProperty({ type: String })
  automationId!: string;

  @ApiProperty({ type: Boolean })
  addMemo!: boolean;

  @ApiProperty({ type: Number })
  probability!: number;

  @ApiProperty({ type: Number })
  tokenCount!: number;

  @ApiProperty({ type: Number })
  createdAtMs!: number;

  @ApiProperty({ type: Number })
  updatedAtMs!: number;
}

export class WorldbookDetailResponseDto extends WorldbookSummaryResponseDto {
  @ApiProperty({ enum: ['sillytavern_world_info', 'rolesta'] })
  sourceFormat!: WorldbookSourceFormat;

  @ApiProperty({ type: () => [WorldbookEntryResponseDto] })
  entries!: WorldbookEntryResponseDto[];
}

export class WorldbookPageResponseDto {
  @ApiProperty({ type: () => [WorldbookSummaryResponseDto] })
  items!: WorldbookSummaryResponseDto[];

  @ApiProperty({ type: Number })
  pageIndex!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  totalItems!: number;

  @ApiProperty({ type: Number })
  totalPages!: number;
}

export function toWorldbookSummaryResponse(
  worldbook: WorldbookSummary,
): WorldbookSummaryResponseDto {
  return worldbook;
}

export function toWorldbookDetailResponse(worldbook: Worldbook): WorldbookDetailResponseDto {
  return {
    id: worldbook.id,
    ownerUserId: worldbook.ownerUserId,
    visibility: worldbook.visibility,
    name: worldbook.name,
    description: worldbook.description,
    tags: worldbook.tags,
    entryCount: worldbook.entries.length,
    enabledEntryCount: worldbook.entries.filter((entry) => entry.enabled).length,
    tokenCount: worldbook.entries.reduce((total, entry) => total + entry.tokenCount, 0),
    sourceFormat: worldbook.sourceFormat,
    entries: worldbook.entries.map(toWorldbookEntryResponse),
    createdAtMs: worldbook.createdAtMs,
    updatedAtMs: worldbook.updatedAtMs,
    lastUsedAtMs: worldbook.lastUsedAtMs,
    usageCount: worldbook.usageCount,
  };
}

export function toWorldbookPageResponse(
  page: PageResponse<WorldbookSummary>,
): WorldbookPageResponseDto {
  return {
    items: page.items.map(toWorldbookSummaryResponse),
    pageIndex: page.pageIndex,
    pageSize: page.pageSize,
    totalItems: page.totalItems,
    totalPages: page.totalPages,
  };
}

function toWorldbookEntryResponse(entry: WorldbookEntry): WorldbookEntryResponseDto {
  return entry;
}
