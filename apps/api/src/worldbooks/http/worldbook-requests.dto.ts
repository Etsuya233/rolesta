import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import {
  SORT_DIRECTIONS,
  WORLDBOOK_SORT_KEYS,
  type SortDirection,
  type WorldbookSortKey,
} from "../application/worldbook-store.js";
import {
  WORLDBOOK_ENTRY_ROLES,
  WORLDBOOK_INSERTION_POSITIONS,
  WORLDBOOK_SELECTIVE_LOGICS,
  WORLDBOOK_VISIBILITIES,
  type WorldbookEntryRole,
  type WorldbookInsertionPosition,
  type WorldbookSelectiveLogic,
  type WorldbookVisibility,
} from "../domain/worldbook.js";

export class ListWorldbooksQueryDto {
  @ApiPropertyOptional({ enum: WORLDBOOK_SORT_KEYS })
  @IsOptional()
  @IsIn(WORLDBOOK_SORT_KEYS)
  sort?: WorldbookSortKey;

  @ApiPropertyOptional({ enum: SORT_DIRECTIONS })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  direction?: SortDirection;

  @ApiPropertyOptional({ minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageIndex?: number;

  @ApiPropertyOptional({ maximum: 100, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;
}

export class WorldbookEditableFieldsDto {
  @ApiPropertyOptional({ enum: WORLDBOOK_VISIBILITIES })
  @IsOptional()
  @IsIn(WORLDBOOK_VISIBILITIES)
  visibility?: WorldbookVisibility;

  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  scanDepth?: number;

  @ApiPropertyOptional({ minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  tokenBudget?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  recursiveScan?: boolean;
}

export class CreateWorldbookRequestDto extends WorldbookEditableFieldsDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  declare name: string;
}

export class UpdateWorldbookRequestDto extends WorldbookEditableFieldsDto {}

export class WorldbookEntryEditableFieldsDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  primaryKeys?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryKeys?: string[];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  selective?: boolean;

  @ApiPropertyOptional({ enum: WORLDBOOK_SELECTIVE_LOGICS })
  @IsOptional()
  @IsIn(WORLDBOOK_SELECTIVE_LOGICS)
  selectiveLogic?: WorldbookSelectiveLogic;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  constant?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  vectorized?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  matchWholeWords?: boolean;

  @ApiPropertyOptional({ enum: WORLDBOOK_INSERTION_POSITIONS })
  @IsOptional()
  @IsIn(WORLDBOOK_INSERTION_POSITIONS)
  insertionPosition?: WorldbookInsertionPosition;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insertionOrder?: number;

  @ApiPropertyOptional({ minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({ enum: WORLDBOOK_ENTRY_ROLES })
  @IsOptional()
  @IsIn(WORLDBOOK_ENTRY_ROLES)
  insertionRole?: WorldbookEntryRole;

  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  anchorName?: string;

  @ApiPropertyOptional({ minimum: 0, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  scanDepth?: number | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  excludeRecursion?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  preventRecursion?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  delayUntilRecursion?: boolean;

  @ApiPropertyOptional({ maximum: 100, minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;
}

export class CreateWorldbookEntryRequestDto extends WorldbookEntryEditableFieldsDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  declare name: string;

  @ApiProperty({ type: String })
  @IsString()
  declare content: string;
}

export class UpdateWorldbookEntryRequestDto extends WorldbookEntryEditableFieldsDto {}

export class UpdateWorldbookEntryOrderItemDto {
  @ApiProperty({ type: String })
  @IsString()
  entryId!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  enabled!: boolean;
}

export class UpdateWorldbookEntryOrderRequestDto {
  @ApiProperty({ type: () => [UpdateWorldbookEntryOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateWorldbookEntryOrderItemDto)
  entries!: UpdateWorldbookEntryOrderItemDto[];
}
