import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, ValidateIf } from 'class-validator';
import type { AssetDefaults } from '../domain/asset-defaults.js';

export class UpdateAssetDefaultsRequestDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  personaCharacterId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  presetId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  modelProviderId?: string | null;
}

export class AssetDefaultsResponseDto implements AssetDefaults {
  @ApiProperty({ nullable: true, type: String })
  personaCharacterId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  presetId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  modelProviderId!: string | null;
}
