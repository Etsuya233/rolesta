import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { CurrentUserResponseDto } from './dto/current-user-response.dto.js';
import { LoginRequestDto } from './dto/login-request.dto.js';
import { SetupAdminRequestDto } from './dto/setup-admin-request.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get('current-user')
  @ApiOkResponse({ type: CurrentUserResponseDto })
  getCurrentUser(): CurrentUserResponseDto {
    return this.authService.getCurrentUser();
  }

  @Post('login')
  @ApiOkResponse({ type: CurrentUserResponseDto })
  login(@Body() _body: LoginRequestDto): CurrentUserResponseDto {
    return this.authService.getCurrentUser();
  }

  @Post('setup-admin')
  @ApiOkResponse({ type: CurrentUserResponseDto })
  setupAdmin(@Body() _body: SetupAdminRequestDto): CurrentUserResponseDto {
    return this.authService.getCurrentUser();
  }

  @Post('logout')
  @ApiOkResponse({ schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  logout(): { ok: true } {
    return { ok: true };
  }
}
