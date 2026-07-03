import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  username!: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  password!: string;
}

export class SetupAdminCmdDTO {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  username!: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  password!: string;
}
