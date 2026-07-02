import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiEnvelopeOkResponse } from '../openapi/api-envelope-response.decorator.js';
import { AuthService } from './auth.service.js';
import { CurrentUserResponseDto } from './dto/current-user-response.dto.js';
import { LoginRequestDto } from './dto/login-request.dto.js';
import { SetupAdminRequestDto } from './dto/setup-admin-request.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get('current-user')
  @ApiEnvelopeOkResponse({ type: CurrentUserResponseDto })
  getCurrentUser(): CurrentUserResponseDto {
    return this.authService.getCurrentUser();
  }

  @Post('login')
  @ApiEnvelopeOkResponse({ type: CurrentUserResponseDto })
  login(@Body() body: LoginRequestDto): CurrentUserResponseDto {
    void body;
    return this.authService.getCurrentUser();
  }

  @Post('setup-admin')
  @ApiEnvelopeOkResponse({ type: CurrentUserResponseDto })
  setupAdmin(@Body() body: SetupAdminRequestDto): CurrentUserResponseDto {
    void body;
    return this.authService.getCurrentUser();
  }

  @Post('logout')
  @ApiEnvelopeOkResponse({ schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  logout(): { ok: true } {
    return { ok: true };
  }
}
