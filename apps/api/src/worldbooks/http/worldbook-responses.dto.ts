import { ApiProperty } from "@nestjs/swagger";
import type { PageResponse } from "@rolesta/shared";
import type {
  Worldbook,
  WorldbookEntry,
  WorldbookInsertionPosition,
  WorldbookSourceFormat,
  WorldbookSummary,
  WorldbookVisibility,
} from "../domain/worldbook.js";

export class WorldbookSummaryResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  ownerUserId!: string;

  @ApiProperty({ enum: ["private", "public"] })
  visibility!: WorldbookVisibility;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: String })
  description!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ type: Number })
  scanDepth!: number;

  @ApiProperty({ type: Number })
  tokenBudget!: number;

  @ApiProperty({ type: Boolean })
  recursiveScan!: boolean;

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

  @ApiProperty({ type: Boolean })
  constant!: boolean;

  @ApiProperty({ type: Boolean })
  caseSensitive!: boolean;

  @ApiProperty({ type: Boolean })
  matchWholeWords!: boolean;

  @ApiProperty({
    enum: [
      "beforeChar",
      "afterChar",
      "beforeHistory",
      "afterHistory",
      "unknown",
    ],
  })
  insertionPosition!: WorldbookInsertionPosition;

  @ApiProperty({ type: Number })
  insertionOrder!: number;

  @ApiProperty({ type: Number })
  depth!: number;

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
  @ApiProperty({ enum: ["sillytavern_world_info", "rolesta"] })
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

export function toWorldbookDetailResponse(
  worldbook: Worldbook,
): WorldbookDetailResponseDto {
  return {
    id: worldbook.id,
    ownerUserId: worldbook.ownerUserId,
    visibility: worldbook.visibility,
    name: worldbook.name,
    description: worldbook.description,
    tags: worldbook.tags,
    scanDepth: worldbook.scanDepth,
    tokenBudget: worldbook.tokenBudget,
    recursiveScan: worldbook.recursiveScan,
    entryCount: worldbook.entries.length,
    enabledEntryCount: worldbook.entries.filter((entry) => entry.enabled)
      .length,
    tokenCount: worldbook.entries.reduce(
      (total, entry) => total + entry.tokenCount,
      0,
    ),
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

function toWorldbookEntryResponse(
  entry: WorldbookEntry,
): WorldbookEntryResponseDto {
  return entry;
}
