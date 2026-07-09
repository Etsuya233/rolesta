import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  MODEL_PROVIDER_SORT_KEYS,
  SORT_DIRECTIONS,
  type ModelProviderSortKey,
  type SortDirection,
} from '../ports/model-provider-store.js';
import {
  MODEL_PROVIDER_KINDS,
  type ModelProviderKind,
} from '../domain/model-provider-catalog.js';

export class ListModelProvidersQueryDto {
  @ApiPropertyOptional({ enum: MODEL_PROVIDER_SORT_KEYS })
  @IsOptional()
  @IsIn(MODEL_PROVIDER_SORT_KEYS)
  sort?: ModelProviderSortKey;

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

export class CreateModelProviderRequestDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ enum: MODEL_PROVIDER_KINDS })
  @IsIn(MODEL_PROVIDER_KINDS)
  providerKind!: ModelProviderKind;

  @ApiProperty({ type: String })
  @IsString()
  baseUrl!: string;

  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultModelName?: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  selectedApiKeyId?: string | null;
}

export class UpdateModelProviderRequestDto {
  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: MODEL_PROVIDER_KINDS })
  @IsOptional()
  @IsIn(MODEL_PROVIDER_KINDS)
  providerKind?: ModelProviderKind;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  defaultModelName?: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  selectedApiKeyId?: string | null;
}

export class SaveModelProviderApiKeyRequestDto {
  @ApiPropertyOptional({ maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  secret?: string;
}

export class CreateModelProviderApiKeyRequestDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ type: String })
  @IsString()
  secret!: string;
}

export class SetSelectedModelProviderApiKeyRequestDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  selectedApiKeyId!: string | null;
}

export class ModelProviderConnectionPreviewRequestDto {
  @ApiProperty({ enum: MODEL_PROVIDER_KINDS })
  @IsIn(MODEL_PROVIDER_KINDS)
  providerKind!: ModelProviderKind;

  @ApiProperty({ type: String })
  @IsString()
  baseUrl!: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  apiKeySecret?: string;
}

export class TestModelProviderConnectionRequestDto extends ModelProviderConnectionPreviewRequestDto {
  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @MaxLength(255)
  defaultModelName!: string;
}
