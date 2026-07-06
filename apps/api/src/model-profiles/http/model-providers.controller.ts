import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import { CreateModelProviderApiKeyUseCase } from '../application/create-model-provider-api-key.use-case.js';
import { CreateModelProviderUseCase } from '../application/create-model-provider.use-case.js';
import { DeleteModelProviderApiKeyUseCase } from '../application/delete-model-provider-api-key.use-case.js';
import { DeleteModelProviderUseCase } from '../application/delete-model-provider.use-case.js';
import { GetModelProviderUseCase } from '../application/get-model-provider.use-case.js';
import { ListModelProviderModelsUseCase } from '../application/list-model-provider-models.use-case.js';
import { ListModelProvidersUseCase } from '../application/list-model-providers.use-case.js';
import { ModelProviderApplicationError } from '../application/model-provider-application-error.js';
import { SetSelectedModelProviderApiKeyUseCase } from '../application/set-selected-model-provider-api-key.use-case.js';
import { TestModelProviderConnectionUseCase } from '../application/test-model-provider-connection.use-case.js';
import { UpdateModelProviderApiKeyUseCase } from '../application/update-model-provider-api-key.use-case.js';
import { UpdateModelProviderUseCase } from '../application/update-model-provider.use-case.js';
import { MODEL_PROVIDER_CATALOG } from '../domain/model-provider-catalog.js';
import { toApiFailure } from './model-provider-application-error.mapper.js';
import {
  CreateModelProviderApiKeyRequestDto,
  CreateModelProviderRequestDto,
  ListModelProvidersQueryDto,
  ModelProviderConnectionPreviewRequestDto,
  SaveModelProviderApiKeyRequestDto,
  SetSelectedModelProviderApiKeyRequestDto,
  TestModelProviderConnectionRequestDto,
  UpdateModelProviderRequestDto,
} from './model-provider-requests.dto.js';
import {
  ModelProviderCatalogResponseDto,
  ModelProviderDetailResponseDto,
  ModelProviderModelListResponseDto,
  ModelProviderPageResponseDto,
  TestModelProviderConnectionResponseDto,
  toModelProviderCatalogResponse,
  toModelProviderDetailResponse,
  toModelProviderModelListResponse,
  toModelProviderPageResponse,
  toTestModelProviderConnectionResponse,
} from './model-provider-responses.dto.js';

@ApiTags('model-providers')
@UseGuards(AuthGuard)
@Controller('model-providers')
export class ModelProvidersController {
  constructor(
    private readonly listModelProvidersUseCase: ListModelProvidersUseCase,
    private readonly getModelProviderUseCase: GetModelProviderUseCase,
    private readonly createModelProviderUseCase: CreateModelProviderUseCase,
    private readonly updateModelProviderUseCase: UpdateModelProviderUseCase,
    private readonly deleteModelProviderUseCase: DeleteModelProviderUseCase,
    private readonly createModelProviderApiKeyUseCase: CreateModelProviderApiKeyUseCase,
    private readonly updateModelProviderApiKeyUseCase: UpdateModelProviderApiKeyUseCase,
    private readonly deleteModelProviderApiKeyUseCase: DeleteModelProviderApiKeyUseCase,
    private readonly setSelectedModelProviderApiKeyUseCase: SetSelectedModelProviderApiKeyUseCase,
    private readonly listModelProviderModelsUseCase: ListModelProviderModelsUseCase,
    private readonly testModelProviderConnectionUseCase: TestModelProviderConnectionUseCase,
  ) {}

  @Get('catalog')
  @ApiEnvelopeOkResponse({ type: ModelProviderCatalogResponseDto })
  catalog(): ModelProviderCatalogResponseDto {
    return toModelProviderCatalogResponse(MODEL_PROVIDER_CATALOG);
  }

  @Get()
  @ApiEnvelopeOkResponse({ type: ModelProviderPageResponseDto })
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListModelProvidersQueryDto,
  ): Promise<ModelProviderPageResponseDto> {
    return toModelProviderPageResponse(
      await this.listModelProvidersUseCase.execute({
        viewerUserId: request.authUser.id,
        ...query,
      }),
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderDetailResponse(
        await this.getModelProviderUseCase.execute({
          id,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  @Post()
  @ApiBody({ type: CreateModelProviderRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateModelProviderRequestDto,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderDetailResponse(
        await this.createModelProviderUseCase.execute({
          ownerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateModelProviderRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateModelProviderRequestDto,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderDetailResponse(
        await this.updateModelProviderUseCase.execute({
          id,
          viewerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  async delete(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<{ ok: true }> {
    return this.withApplicationErrors(async () => {
      await this.deleteModelProviderUseCase.execute({ id, viewerUserId: request.authUser.id });
      return { ok: true };
    });
  }

  @Post(':id/api-keys')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: CreateModelProviderApiKeyRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  async createApiKey(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CreateModelProviderApiKeyRequestDto,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderDetailResponse(
        await this.createModelProviderApiKeyUseCase.execute({
          configId: id,
          viewerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Patch(':id/api-keys/:apiKeyId')
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'apiKeyId', type: String })
  @ApiBody({ type: SaveModelProviderApiKeyRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  async updateApiKey(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('apiKeyId') apiKeyId: string,
    @Body() body: SaveModelProviderApiKeyRequestDto,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderDetailResponse(
        await this.updateModelProviderApiKeyUseCase.execute({
          configId: id,
          apiKeyId,
          viewerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Delete(':id/api-keys/:apiKeyId')
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'apiKeyId', type: String })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  async deleteApiKey(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('apiKeyId') apiKeyId: string,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderDetailResponse(
        await this.deleteModelProviderApiKeyUseCase.execute({
          configId: id,
          apiKeyId,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  @Put(':id/selected-api-key')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: SetSelectedModelProviderApiKeyRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  async setSelectedApiKey(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SetSelectedModelProviderApiKeyRequestDto,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderDetailResponse(
        await this.setSelectedModelProviderApiKeyUseCase.execute({
          configId: id,
          viewerUserId: request.authUser.id,
          selectedApiKeyId: body.selectedApiKeyId ?? null,
        }),
      ),
    );
  }

  @Post('models/preview')
  @ApiBody({ type: ModelProviderConnectionPreviewRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderModelListResponseDto })
  async previewModels(
    @Body() body: ModelProviderConnectionPreviewRequestDto,
  ): Promise<ModelProviderModelListResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderModelListResponse(
        await this.listModelProviderModelsUseCase.preview({
          providerKind: body.providerKind,
          baseUrl: body.baseUrl,
          apiKeySecret: body.apiKeySecret,
        }),
      ),
    );
  }

  @Post('test-connection/preview')
  @ApiBody({ type: TestModelProviderConnectionRequestDto })
  @ApiEnvelopeOkResponse({ type: TestModelProviderConnectionResponseDto })
  async previewTestConnection(
    @Body() body: TestModelProviderConnectionRequestDto,
  ): Promise<TestModelProviderConnectionResponseDto> {
    return this.withApplicationErrors(async () =>
      toTestModelProviderConnectionResponse(
        await this.testModelProviderConnectionUseCase.preview({
          providerKind: body.providerKind,
          baseUrl: body.baseUrl,
          defaultModelName: body.defaultModelName,
          apiKeySecret: body.apiKeySecret,
        }),
      ),
    );
  }

  @Post(':id/models')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: ModelProviderModelListResponseDto })
  async savedModels(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ModelProviderModelListResponseDto> {
    return this.withApplicationErrors(async () =>
      toModelProviderModelListResponse(
        await this.listModelProviderModelsUseCase.saved({
          configId: id,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  @Post(':id/test-connection')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: TestModelProviderConnectionResponseDto })
  async savedTestConnection(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TestModelProviderConnectionResponseDto> {
    return this.withApplicationErrors(async () =>
      toTestModelProviderConnectionResponse(
        await this.testModelProviderConnectionUseCase.saved({
          configId: id,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  private async withApplicationErrors<TResult>(handler: () => Promise<TResult>): Promise<TResult> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof ModelProviderApplicationError) {
        throw toApiFailure(error);
      }

      throw error;
    }
  }
}
