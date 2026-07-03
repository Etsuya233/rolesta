import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  username!: string;

  @ApiProperty({ type: String })
  displayName!: string;

  @ApiProperty({ type: String, enum: ['admin', 'user'] })
  role!: 'admin' | 'user';
}

export class CurrentUserResponseDto {
  @ApiProperty({ nullable: true, type: () => CurrentUserDto })
  user!: CurrentUserDto | null;
}

export class AuthenticatedUserResponseDto {
  @ApiProperty({ type: String })
  token!: string;

  @ApiProperty({ type: () => CurrentUserDto })
  user!: CurrentUserDto;
}

export class SetupStatusResponseDto {
  @ApiProperty({ type: Boolean })
  requiresSetup!: boolean;
}
