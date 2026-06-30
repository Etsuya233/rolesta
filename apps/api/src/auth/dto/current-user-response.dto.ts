import { ApiProperty } from '@nestjs/swagger';

class CurrentUserDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  email!: string;

  @ApiProperty({ type: String })
  displayName!: string;

  @ApiProperty({ type: String, enum: ['admin', 'user'] })
  role!: 'admin' | 'user';
}

export class CurrentUserResponseDto {
  @ApiProperty({ nullable: true, type: () => CurrentUserDto })
  user!: CurrentUserDto | null;
}
