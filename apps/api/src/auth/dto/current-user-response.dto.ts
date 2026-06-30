import { ApiProperty } from '@nestjs/swagger';

class CurrentUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ['admin', 'user'] })
  role!: 'admin' | 'user';
}

export class CurrentUserResponseDto {
  @ApiProperty({ nullable: true, type: CurrentUserDto })
  user!: CurrentUserDto | null;
}
