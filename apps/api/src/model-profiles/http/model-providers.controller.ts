import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import { CreateModelProviderUseCase } from '../application/create-model-provider.use-case.js';
import { DeleteModelProviderUseCase } from '../application/delete-model-provider.use-case.js';
import { GetModelProviderUseCase } from '../application/get-model-provider.use-case.js';
import { ListModelProviderModelsUseCase } from '../application/list-model-provider-models.use-case.js';
import { ListModelProvidersUseCase } from '../application/list-model-providers.use-case.js';
import {
  ModelProviderApplicationError,
  type ModelProviderApplicationErrorReason,
} from '../application/model-provider-application-error.js';
import { TestModelProviderConnectionUseCase } from '../application/test-model-provider-connection.use-case.js';
import { UpdateModelProviderUseCase } from '../application/update-model-provider.use-case.js';
import { MODEL_PROVIDER_CATALOG } from '../domain/model-provider-catalog.js';
import { toApiFailure } from './model-provider-application-error.mapper.js';
import {
  CreateModelProviderRequestDto,
  ListModelProvidersQueryDto,
  ModelProviderConnectionPreviewRequestDto,
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
    private readonly listUseCase: ListModelProvidersUseCase,
    private readonly getUseCase: GetModelProviderUseCase,
    private readonly createUseCase: CreateModelProviderUseCase,
    private readonly updateUseCase: UpdateModelProviderUseCase,
    private readonly deleteUseCase: DeleteModelProviderUseCase,
    private readonly modelsUseCase: ListModelProviderModelsUseCase,
    private readonly testUseCase: TestModelProviderConnectionUseCase,
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
      await this.listUseCase.execute({
        viewerUserId: request.authUser.id,
        ...query,
      }),
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withErrors(async () =>
      toModelProviderDetailResponse(
        await this.getUseCase.execute({
          id,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  @Post()
  @ApiBody({ type: CreateModelProviderRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderDetailResponseDto })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateModelProviderRequestDto,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withErrors(async () =>
      toModelProviderDetailResponse(
        await this.createUseCase.execute({
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
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateModelProviderRequestDto,
  ): Promise<ModelProviderDetailResponseDto> {
    return this.withErrors(async () =>
      toModelProviderDetailResponse(
        await this.updateUseCase.execute({
          id,
          viewerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({
    schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
  })
  delete(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<{ ok: true }> {
    return this.withErrors(async () => {
      await this.deleteUseCase.execute({
        id,
        viewerUserId: request.authUser.id,
      });
      return { ok: true };
    });
  }

  @Post('models/preview')
  @ApiBody({ type: ModelProviderConnectionPreviewRequestDto })
  @ApiEnvelopeOkResponse({ type: ModelProviderModelListResponseDto })
  previewModels(
    @Req() request: AuthenticatedRequest,
    @Body() body: ModelProviderConnectionPreviewRequestDto,
  ): Promise<ModelProviderModelListResponseDto> {
    return this.withErrors(async () =>
      toModelProviderModelListResponse(
        await this.modelsUseCase.preview({
          providerKind: body.providerKind,
          baseUrl: body.baseUrl,
          apiKeySecret: body.apiKeySecret,
          ...(body.apiKeyId ? { apiKeyId: body.apiKeyId, viewerUserId: request.authUser.id } : {}),
        }),
      ),
    );
  }

  @Post('test-connection/preview')
  @ApiBody({ type: TestModelProviderConnectionRequestDto })
  @ApiEnvelopeOkResponse({ type: TestModelProviderConnectionResponseDto })
  previewTest(
    @Req() request: AuthenticatedRequest,
    @Body() body: TestModelProviderConnectionRequestDto,
  ): Promise<TestModelProviderConnectionResponseDto> {
    return this.withErrors(async () =>
      toTestModelProviderConnectionResponse(
        await this.testUseCase.preview({
          providerKind: body.providerKind,
          baseUrl: body.baseUrl,
          defaultModelName: body.defaultModelName,
          apiKeySecret: body.apiKeySecret,
          ...(body.apiKeyId ? { apiKeyId: body.apiKeyId, viewerUserId: request.authUser.id } : {}),
        }),
      ),
    );
  }

  @Post(':id/models')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: ModelProviderModelListResponseDto })
  savedModels(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ModelProviderModelListResponseDto> {
    return this.withErrors(async () =>
      toModelProviderModelListResponse(
        await this.modelsUseCase.saved({
          configId: id,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  @Post(':id/test-connection')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: TestModelProviderConnectionResponseDto })
  savedTest(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TestModelProviderConnectionResponseDto> {
    return this.withErrors(async () =>
      toTestModelProviderConnectionResponse(
        await this.testUseCase.saved({
          configId: id,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  private async withErrors<T>(handler: () => Promise<T>): Promise<T> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof ModelProviderApplicationError)
        throw toApiFailure(
          error as ModelProviderApplicationError<ModelProviderApplicationErrorReason>,
        );
      throw error;
    }
  }
}
