import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import {
  ChatPreferencesApplicationError,
  type ChatPreferencesApplicationErrorReason,
} from '../application/chat-preferences-application-error.js';
import { GetAssetDefaultsUseCase } from '../application/get-asset-defaults.use-case.js';
import { UpdateAssetDefaultsUseCase } from '../application/update-asset-defaults.use-case.js';
import { AssetDefaultsResponseDto, UpdateAssetDefaultsRequestDto } from './asset-defaults.dto.js';
import { toApiFailure } from './chat-preferences-application-error.mapper.js';

@ApiTags('chat-preferences')
@UseGuards(AuthGuard)
@Controller('chat-preferences/assets')
export class ChatPreferencesController {
  constructor(
    private readonly getAssetDefaultsUseCase: GetAssetDefaultsUseCase,
    private readonly updateAssetDefaultsUseCase: UpdateAssetDefaultsUseCase,
  ) {}

  @Get()
  @ApiEnvelopeOkResponse({ type: AssetDefaultsResponseDto })
  get(@Req() request: AuthenticatedRequest): Promise<AssetDefaultsResponseDto> {
    return this.getAssetDefaultsUseCase.execute(request.authUser.id);
  }

  @Patch()
  @ApiBody({ type: UpdateAssetDefaultsRequestDto })
  @ApiEnvelopeOkResponse({ type: AssetDefaultsResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateAssetDefaultsRequestDto,
  ): Promise<AssetDefaultsResponseDto> {
    try {
      return await this.updateAssetDefaultsUseCase.execute(request.authUser.id, body);
    } catch (error) {
      if (error instanceof ChatPreferencesApplicationError) {
        throw toApiFailure(
          error as ChatPreferencesApplicationError<ChatPreferencesApplicationErrorReason>,
        );
      }

      throw error;
    }
  }
}
