import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  CharacterListScope,
  CharacterSortKey,
  SortDirection,
} from '../application/character-card-store.js';
import type { CharacterVisibility } from '../domain/character-visibility.js';

export class ListCharactersQueryDto {
  @IsOptional()
  @IsIn(['all', 'mine', 'public'])
  scope?: CharacterListScope;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name', 'lastUsedAt', 'usageCount'])
  sort?: CharacterSortKey;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: SortDirection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageIndex?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;
}

export class CharacterEditableFieldsDto {
  @IsOptional()
  @IsIn(['private', 'public'])
  visibility?: CharacterVisibility;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nickname?: string | null;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  creator?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  personality?: string;

  @IsOptional()
  @IsString()
  scenario?: string;

  @IsOptional()
  @IsString()
  firstMessage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternateGreetings?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupOnlyGreetings?: string[];

  @IsOptional()
  @IsString()
  messageExample?: string;

  @IsOptional()
  @IsString()
  creatorNotes?: string;

  @IsOptional()
  @IsObject()
  creatorNotesMultilingual?: Record<string, string>;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  postHistoryInstructions?: string;

  @IsOptional()
  @IsObject()
  characterBook?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  assets?: unknown[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  source?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateCharacterRequestDto extends CharacterEditableFieldsDto {
  @IsString()
  @MaxLength(255)
  declare name: string;
}

export class UpdateCharacterRequestDto extends CharacterEditableFieldsDto {}
