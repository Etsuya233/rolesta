import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import { CreateModelProviderApiKeyUseCase } from '../application/create-model-provider-api-key.use-case.js';
import { DeleteModelProviderApiKeyUseCase } from '../application/delete-model-provider-api-key.use-case.js';
import { ListApiKeysUseCase } from '../application/list-api-keys.use-case.js';
import {
  ModelProviderApplicationError,
  type ModelProviderApplicationErrorReason,
} from '../application/model-provider-application-error.js';
import { UpdateModelProviderApiKeyUseCase } from '../application/update-model-provider-api-key.use-case.js';
import {
  CreateModelProviderApiKeyRequestDto,
  SaveModelProviderApiKeyRequestDto,
} from './model-provider-requests.dto.js';
import {
  ApiKeyListResponseDto,
  DeleteApiKeyResponseDto,
  ModelProviderApiKeyResponseDto,
  toModelProviderApiKeyResponse,
} from './model-provider-responses.dto.js';
import { toApiFailure } from './model-provider-application-error.mapper.js';

@ApiTags('api-keys')
@UseGuards(AuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(
    private readonly listUseCase: ListApiKeysUseCase,
    private readonly createUseCase: CreateModelProviderApiKeyUseCase,
    private readonly updateUseCase: UpdateModelProviderApiKeyUseCase,
    private readonly deleteUseCase: DeleteModelProviderApiKeyUseCase,
  ) {}

  @Get()
  @ApiEnvelopeOkResponse({ type: ApiKeyListResponseDto })
  async list(@Req() request: AuthenticatedRequest): Promise<ApiKeyListResponseDto> {
    return this.withErrors(async () => ({
      items: (await this.listUseCase.execute(request.authUser.id)).map(
        toModelProviderApiKeyResponse,
      ),
    }));
  }

  @Post()
  @ApiBody({ type: CreateModelProviderApiKeyRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderApiKeyResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateModelProviderApiKeyRequestDto,
  ): Promise<ModelProviderApiKeyResponseDto> {
    return this.withErrors(async () =>
      toModelProviderApiKeyResponse(
        await this.createUseCase.execute({
          ownerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: SaveModelProviderApiKeyRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderApiKeyResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SaveModelProviderApiKeyRequestDto,
  ): Promise<ModelProviderApiKeyResponseDto> {
    return this.withErrors(async () =>
      toModelProviderApiKeyResponse(
        await this.updateUseCase.execute({
          apiKeyId: id,
          ownerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Get(':id/references')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: DeleteApiKeyResponseDto })
  async references(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<DeleteApiKeyResponseDto> {
    return this.withErrors(async () => ({
      affectedProviderCount: await this.deleteUseCase.referenceCount({
        apiKeyId: id,
        ownerUserId: request.authUser.id,
      }),
    }));
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: DeleteApiKeyResponseDto })
  delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<DeleteApiKeyResponseDto> {
    return this.withErrors(() =>
      this.deleteUseCase.execute({
        apiKeyId: id,
        ownerUserId: request.authUser.id,
      }),
    );
  }

  private async withErrors<TResult>(handler: () => Promise<TResult>): Promise<TResult> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof ModelProviderApplicationError) {
        throw toApiFailure(
          error as ModelProviderApplicationError<ModelProviderApplicationErrorReason>,
        );
      }

      throw error;
    }
  }
}
