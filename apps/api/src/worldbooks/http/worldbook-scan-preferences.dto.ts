import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, Max, Min } from 'class-validator';
import {
  CHARACTER_LORE_INSERTION_STRATEGIES,
  type CharacterLoreInsertionStrategy,
  type WorldbookScanPreferences,
} from '../domain/worldbook-scan-preferences.js';

export class WorldbookScanPreferencesDto implements WorldbookScanPreferences {
  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  scanDepth!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minActivations!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minActivationsDepthMax!: number;

  @ApiProperty({ maximum: 100, minimum: 0, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  budgetPercent!: number;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetCap!: number;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  recursive!: boolean;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  caseSensitive!: boolean;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  matchWholeWords!: boolean;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  useGroupScoring!: boolean;

  @ApiProperty({ minimum: 0, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRecursionSteps!: number;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  includeNames!: boolean;

  @ApiProperty({ enum: CHARACTER_LORE_INSERTION_STRATEGIES })
  @IsIn(CHARACTER_LORE_INSERTION_STRATEGIES)
  characterLoreInsertionStrategy!: CharacterLoreInsertionStrategy;
}
