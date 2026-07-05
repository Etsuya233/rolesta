import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  PRESET_SORT_KEYS,
  SORT_DIRECTIONS,
  type PresetSortKey,
  type SortDirection,
} from '../application/preset-store.js';
import {
  PRESET_ENTRY_POSITIONS,
  PRESET_ENTRY_ROLES,
  type PresetEntryPosition,
  type PresetEntryRole,
} from '../domain/preset.js';

export class ListPresetsQueryDto {
  @ApiPropertyOptional({ enum: PRESET_SORT_KEYS })
  @IsOptional()
  @IsIn(PRESET_SORT_KEYS)
  sort?: PresetSortKey;

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

export class PresetModelSettingsDto {
  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  contextLength?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  maxResponseLength?: number | null;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  temperature?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  presencePenalty?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  frequencyPenalty?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  repetitionPenalty?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  topP?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  topK?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  minP?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  topA?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  seed?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  n?: number | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  reasoningEffort?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  verbosity?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  showThoughts?: boolean;
}

export class PresetEditableFieldsDto {
  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ type: PresetModelSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PresetModelSettingsDto)
  modelSettings?: PresetModelSettingsDto;
}

export class CreatePresetRequestDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ type: PresetModelSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PresetModelSettingsDto)
  modelSettings?: PresetModelSettingsDto;
}

export class UpdatePresetRequestDto extends PresetEditableFieldsDto {}

export class CreatePresetEntryRequestDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ enum: PRESET_ENTRY_ROLES })
  @IsIn(PRESET_ENTRY_ROLES)
  role!: PresetEntryRole;

  @ApiProperty({ enum: PRESET_ENTRY_POSITIONS })
  @IsIn(PRESET_ENTRY_POSITIONS)
  position!: PresetEntryPosition;

  @ApiProperty({ type: String })
  @IsString()
  content!: string;
}

export class UpdatePresetEntryRequestDto {
  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: PRESET_ENTRY_ROLES })
  @IsOptional()
  @IsIn(PRESET_ENTRY_ROLES)
  role?: PresetEntryRole;

  @ApiPropertyOptional({ enum: PRESET_ENTRY_POSITIONS })
  @IsOptional()
  @IsIn(PRESET_ENTRY_POSITIONS)
  position?: PresetEntryPosition;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdatePresetPromptItemDto {
  @ApiProperty({ type: String })
  @IsString()
  entryId!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  enabled!: boolean;
}

export class UpdatePresetPromptItemsRequestDto {
  @ApiProperty({ type: () => [UpdatePresetPromptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePresetPromptItemDto)
  items!: UpdatePresetPromptItemDto[];
}
