import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ApiEnvelopeOkResponse } from '../openapi/api-envelope-response.decorator.js';
import { AuthApplicationError } from './application/auth-application-error.js';
import { GetCurrentUserUseCase } from './application/get-current-user.use-case.js';
import { GetSetupStatusUseCase } from './application/get-setup-status.use-case.js';
import { LoginUseCase } from './application/login.use-case.js';
import { LogoutUseCase } from './application/logout.use-case.js';
import { SetupAdminUseCase } from './application/setup-admin.use-case.js';
import { LoginRequestDto, SetupAdminCmdDTO } from './dto/auth-requests.dto.js';
import {
  AuthenticatedUserResponseDto,
  CurrentUserResponseDto,
  SetupStatusResponseDto,
} from './dto/auth-responses.dto.js';
import { toApiFailure } from './http/auth-application-error.mapper.js';
import { readBearerToken } from './http/bearer-token.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(GetSetupStatusUseCase)
    private readonly getSetupStatusUseCase: GetSetupStatusUseCase,
    @Inject(GetCurrentUserUseCase)
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    @Inject(SetupAdminUseCase)
    private readonly setupAdminUseCase: SetupAdminUseCase,
    @Inject(LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
    @Inject(LogoutUseCase)
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Get('setup-status')
  @ApiEnvelopeOkResponse({ type: SetupStatusResponseDto })
  async getSetupStatus(): Promise<SetupStatusResponseDto> {
    return this.getSetupStatusUseCase.execute();
  }

  @Get('current-user')
  @ApiEnvelopeOkResponse({ type: CurrentUserResponseDto })
  async getCurrentUser(@Req() request: Request): Promise<CurrentUserResponseDto> {
    return this.getCurrentUserUseCase.execute(readBearerToken(request));
  }

  @Post('login')
  @ApiEnvelopeOkResponse({ type: AuthenticatedUserResponseDto })
  async login(@Body() body: LoginRequestDto): Promise<AuthenticatedUserResponseDto> {
    try {
      return await this.loginUseCase.execute(body);
    } catch (error) {
      if (error instanceof AuthApplicationError) {
        throw toApiFailure(error);
      }

      throw error;
    }
  }

  @Post('setup-admin')
  @ApiEnvelopeOkResponse({ type: AuthenticatedUserResponseDto })
  async setupAdmin(@Body() body: SetupAdminCmdDTO): Promise<AuthenticatedUserResponseDto> {
    try {
      return await this.setupAdminUseCase.execute(body);
    } catch (error) {
      if (error instanceof AuthApplicationError) {
        throw toApiFailure(error);
      }

      throw error;
    }
  }

  @Post('logout')
  @ApiEnvelopeOkResponse({ schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  async logout(@Req() request: Request): Promise<{ ok: true }> {
    return this.logoutUseCase.execute(readBearerToken(request));
  }
}

