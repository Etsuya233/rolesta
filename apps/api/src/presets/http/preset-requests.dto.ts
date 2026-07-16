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
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  PRESET_ENTRY_ROLES,
  PRESET_GENERATION_TYPES,
  PRESET_VISIBILITIES,
  PRESET_SLOTS,
  PRESET_SYSTEM_PROMPTS,
  type PresetEntryRole,
  type PresetGenerationType,
  type PresetVisibility,
  type PresetSlot,
  type PresetSystemPrompt,
} from '../domain/preset.js';
import {
  PRESET_LIST_SCOPES,
  PRESET_SORT_KEYS,
  SORT_DIRECTIONS,
  type PresetListScope,
  type PresetSortKey,
  type SortDirection,
} from '../ports/preset-store.js';

export class ListPresetsQueryDto {
  @ApiPropertyOptional({ enum: PRESET_LIST_SCOPES })
  @IsOptional()
  @IsIn(PRESET_LIST_SCOPES)
  scope?: PresetListScope;

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
  @ApiPropertyOptional({ enum: PRESET_VISIBILITIES })
  @IsOptional()
  @IsIn(PRESET_VISIBILITIES)
  visibility?: PresetVisibility;
  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  modelProviderId?: string | null;
  @ApiPropertyOptional({ type: PresetModelSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PresetModelSettingsDto)
  modelSettings?: PresetModelSettingsDto;
}

export class CreatePresetRequestDto {
  @ApiPropertyOptional({ enum: PRESET_VISIBILITIES })
  @IsOptional()
  @IsIn(PRESET_VISIBILITIES)
  visibility?: PresetVisibility;
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;
  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  modelProviderId?: string | null;
  @ApiPropertyOptional({ type: PresetModelSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PresetModelSettingsDto)
  modelSettings?: PresetModelSettingsDto;
}

export class UpdatePresetRequestDto extends PresetEditableFieldsDto {}

export class PresetPromptPlacementDto {
  @ApiProperty({ enum: ['relative', 'inChat'] })
  @IsIn(['relative', 'inChat'])
  kind!: 'relative' | 'inChat';

  @ApiPropertyOptional({ minimum: 0, type: Number })
  @ValidateIf((value: PresetPromptPlacementDto) => value.kind === 'inChat')
  @IsInt()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({ type: Number })
  @ValidateIf((value: PresetPromptPlacementDto) => value.kind === 'inChat')
  @IsInt()
  order?: number;
}

export class PresetDocumentEntryDto {
  @ApiProperty({ type: String })
  @IsString()
  id!: string;
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;
  @ApiProperty({ enum: PRESET_ENTRY_ROLES })
  @IsIn(PRESET_ENTRY_ROLES)
  role!: PresetEntryRole;
  @ApiProperty({ type: PresetPromptPlacementDto })
  @ValidateNested()
  @Type(() => PresetPromptPlacementDto)
  placement!: PresetPromptPlacementDto;
  @ApiProperty({ enum: PRESET_GENERATION_TYPES, isArray: true })
  @IsArray()
  @IsIn(PRESET_GENERATION_TYPES, { each: true })
  generationTypes!: PresetGenerationType[];
  @ApiProperty({ type: String })
  @IsString()
  content!: string;
}

export class PresetDocumentPromptItemDto {
  @ApiProperty({ type: String })
  @IsString()
  id!: string;
  @ApiProperty({ enum: ['slot', 'systemPrompt', 'customPrompt'] })
  @IsIn(['slot', 'systemPrompt', 'customPrompt'])
  kind!: 'slot' | 'systemPrompt' | 'customPrompt';
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  enabled!: boolean;
  @ApiPropertyOptional({ enum: PRESET_SLOTS })
  @IsOptional()
  @IsIn(PRESET_SLOTS)
  slot?: PresetSlot;
  @ApiPropertyOptional({ enum: PRESET_SYSTEM_PROMPTS })
  @IsOptional()
  @IsIn(PRESET_SYSTEM_PROMPTS)
  systemPrompt?: PresetSystemPrompt;
  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
  @ApiPropertyOptional({ enum: PRESET_ENTRY_ROLES })
  @IsOptional()
  @IsIn(PRESET_ENTRY_ROLES)
  role?: PresetEntryRole;
  @ApiPropertyOptional({ type: PresetPromptPlacementDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PresetPromptPlacementDto)
  placement?: PresetPromptPlacementDto;
  @ApiPropertyOptional({ enum: PRESET_GENERATION_TYPES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(PRESET_GENERATION_TYPES, { each: true })
  generationTypes?: PresetGenerationType[];
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content?: string;
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  allowCharacterOverride?: boolean;
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  entryId?: string;
}

export class PresetDocumentModelSettingsDto {
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  contextLength!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  maxResponseLength!: number | null;
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  stream!: boolean;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  temperature!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  presencePenalty!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  frequencyPenalty!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  repetitionPenalty!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  topP!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  topK!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  minP!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  topA!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  seed!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  n!: number | null;
  @ApiProperty({ type: String })
  @IsString()
  reasoningEffort!: string;
  @ApiProperty({ type: String })
  @IsString()
  verbosity!: string;
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  showThoughts!: boolean;
}

export class UpdatePresetDocumentRequestDto {
  @ApiProperty({ enum: PRESET_VISIBILITIES })
  @IsIn(PRESET_VISIBILITIES)
  visibility!: PresetVisibility;
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;
  @ApiProperty({ nullable: true, type: String })
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  modelProviderId!: string | null;
  @ApiProperty({ type: PresetDocumentModelSettingsDto })
  @ValidateNested()
  @Type(() => PresetDocumentModelSettingsDto)
  modelSettings!: PresetDocumentModelSettingsDto;
  @ApiProperty({ type: () => [PresetDocumentEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresetDocumentEntryDto)
  entries!: PresetDocumentEntryDto[];
  @ApiProperty({ type: () => [PresetDocumentPromptItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresetDocumentPromptItemDto)
  promptItems!: PresetDocumentPromptItemDto[];
}

export class CreatePresetEntryRequestDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;
  @ApiProperty({ enum: PRESET_ENTRY_ROLES })
  @IsIn(PRESET_ENTRY_ROLES)
  role!: PresetEntryRole;
  @ApiProperty({ type: PresetPromptPlacementDto })
  @ValidateNested()
  @Type(() => PresetPromptPlacementDto)
  placement!: PresetPromptPlacementDto;
  @ApiProperty({ enum: PRESET_GENERATION_TYPES, isArray: true })
  @IsArray()
  @IsIn(PRESET_GENERATION_TYPES, { each: true })
  generationTypes!: PresetGenerationType[];
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
  @ApiPropertyOptional({ type: PresetPromptPlacementDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PresetPromptPlacementDto)
  placement?: PresetPromptPlacementDto;
  @ApiPropertyOptional({ enum: PRESET_GENERATION_TYPES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(PRESET_GENERATION_TYPES, { each: true })
  generationTypes?: PresetGenerationType[];
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdatePresetPromptItemDto {
  @ApiProperty({ type: String })
  @IsString()
  id!: string;
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
