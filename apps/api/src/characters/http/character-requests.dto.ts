import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CHARACTER_LIST_SCOPES,
  CHARACTER_SORT_KEYS,
  SORT_DIRECTIONS,
  type CharacterListScope,
  type CharacterSortKey,
  type SortDirection,
} from '../ports/character-card-store.js';
import {
  CHARACTER_VISIBILITIES,
  type CharacterVisibility,
} from '../domain/character-visibility.js';

export class AvatarCropRequestDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @Max(1)
  x!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @Max(1)
  y!: number;

  @Type(() => Number)
  @Min(0.000001)
  @Max(1)
  width!: number;

  @Type(() => Number)
  @Min(0.000001)
  @Max(1)
  height!: number;
}

export class ListCharactersQueryDto {
  @ApiPropertyOptional({ enum: CHARACTER_LIST_SCOPES })
  @IsOptional()
  @IsIn(CHARACTER_LIST_SCOPES)
  scope?: CharacterListScope;

  @ApiPropertyOptional({ enum: CHARACTER_SORT_KEYS })
  @IsOptional()
  @IsIn(CHARACTER_SORT_KEYS)
  sort?: CharacterSortKey;

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

export class CharacterEditableFieldsDto {
  @ApiPropertyOptional({ enum: CHARACTER_VISIBILITIES })
  @IsOptional()
  @IsIn(CHARACTER_VISIBILITIES)
  visibility?: CharacterVisibility;

  @ApiPropertyOptional({ maxLength: 255, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nickname?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  version?: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  creator?: string | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  personality?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  scenario?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  firstMessage?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternateGreetings?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupOnlyGreetings?: string[];

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  messageExample?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  creatorNotes?: string;

  @ApiPropertyOptional({
    additionalProperties: { type: 'string' },
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  creatorNotesMultilingual?: Record<string, string>;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  postHistoryInstructions?: string;

  @ApiPropertyOptional({
    additionalProperties: true,
    nullable: true,
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  characterBook?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    items: {},
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  assets?: unknown[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  source?: string[];

  @ApiPropertyOptional({ additionalProperties: true, type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateCharacterRequestDto extends CharacterEditableFieldsDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;
}

export class UpdateCharacterRequestDto extends CharacterEditableFieldsDto {
  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
