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
  WORLDBOOK_CONDITION_LOGICS,
  WORLDBOOK_DEPTH_ROLES,
  WORLDBOOK_GENERATION_TRIGGERS,
  WORLDBOOK_INSERTION_POSITIONS,
  WORLDBOOK_TRI_STATES,
  WORLDBOOK_VISIBILITIES,
  type WorldbookConditionLogic,
  type WorldbookDepthRole,
  type WorldbookGenerationTrigger,
  type WorldbookInsertionPosition,
  type WorldbookTriState,
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

export class WorldbookCharacterFilterDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isExclude!: boolean;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  names!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

export class WorldbookEntryEditableFieldsDto {
  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  externalUid?: number | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  addMemo?: boolean;

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

  @ApiPropertyOptional({ enum: WORLDBOOK_CONDITION_LOGICS })
  @IsOptional()
  @IsIn(WORLDBOOK_CONDITION_LOGICS)
  conditionLogic?: WorldbookConditionLogic;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  selective?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  constant?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  vectorized?: boolean;

  @ApiPropertyOptional({ enum: WORLDBOOK_TRI_STATES })
  @IsOptional()
  @IsIn(WORLDBOOK_TRI_STATES)
  caseSensitive?: WorldbookTriState;

  @ApiPropertyOptional({ enum: WORLDBOOK_TRI_STATES })
  @IsOptional()
  @IsIn(WORLDBOOK_TRI_STATES)
  matchWholeWords?: WorldbookTriState;

  @ApiPropertyOptional({ enum: WORLDBOOK_INSERTION_POSITIONS })
  @IsOptional()
  @IsIn(WORLDBOOK_INSERTION_POSITIONS)
  insertionPosition?: WorldbookInsertionPosition;

  @ApiPropertyOptional({ enum: WORLDBOOK_DEPTH_ROLES })
  @IsOptional()
  @IsIn(WORLDBOOK_DEPTH_ROLES)
  depthRole?: WorldbookDepthRole;

  @ApiPropertyOptional({ maximum: 9999, minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  insertionDepth?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  insertionOrder?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  useProbability?: boolean;

  @ApiPropertyOptional({ maximum: 100, minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({
    maximum: 1000,
    minimum: 0,
    nullable: true,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  scanDepth?: number | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  recursiveScan?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  preventFurtherRecursion?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  delayUntilRecursion?: boolean;

  @ApiPropertyOptional({ minimum: 1, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recursionDelayLevel?: number | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  ignoreBudget?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  groupOverride?: boolean;

  @ApiPropertyOptional({ minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  groupWeight?: number;

  @ApiPropertyOptional({ enum: WORLDBOOK_TRI_STATES })
  @IsOptional()
  @IsIn(WORLDBOOK_TRI_STATES)
  useGroupScoring?: WorldbookTriState;

  @ApiPropertyOptional({ minimum: 0, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sticky?: number | null;

  @ApiPropertyOptional({ minimum: 0, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cooldown?: number | null;

  @ApiPropertyOptional({ minimum: 0, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  delay?: number | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  matchPersonaDescription?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  matchCharacterDescription?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  matchCharacterPersonality?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  matchScenario?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  matchCreatorNotes?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  matchCharacterDepthPrompt?: boolean;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  automationId?: string;

  @ApiPropertyOptional({ enum: WORLDBOOK_GENERATION_TRIGGERS, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(WORLDBOOK_GENERATION_TRIGGERS, { each: true })
  generationTriggers?: WorldbookGenerationTrigger[];

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  outletName?: string;

  @ApiPropertyOptional({ type: () => WorldbookCharacterFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorldbookCharacterFilterDto)
  characterFilter?: WorldbookCharacterFilterDto;
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
