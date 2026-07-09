import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import { PresetApplicationError } from '../application/preset-application-error.js';
import type { PresetApplicationErrorReason } from '../application/preset-application-error.js';
import { CreatePresetEntryUseCase } from '../application/create-preset-entry.use-case.js';
import { CreatePresetUseCase } from '../application/create-preset.use-case.js';
import { DeletePresetEntryUseCase } from '../application/delete-preset-entry.use-case.js';
import { DeletePresetUseCase } from '../application/delete-preset.use-case.js';
import { ExportPresetUseCase } from '../application/export-preset.use-case.js';
import { GetPresetUseCase } from '../application/get-preset.use-case.js';
import { ImportPresetUseCase } from '../application/import-preset.use-case.js';
import { ListPresetsUseCase } from '../application/list-presets.use-case.js';
import { UpdatePresetEntryUseCase } from '../application/update-preset-entry.use-case.js';
import { UpdatePresetPromptItemsUseCase } from '../application/update-preset-prompt-items.use-case.js';
import { UpdatePresetUseCase } from '../application/update-preset.use-case.js';
import { toApiFailure } from './preset-application-error.mapper.js';
import {
  CreatePresetEntryRequestDto,
  CreatePresetRequestDto,
  ListPresetsQueryDto,
  UpdatePresetEntryRequestDto,
  UpdatePresetPromptItemsRequestDto,
  UpdatePresetRequestDto,
} from './preset-requests.dto.js';
import {
  PresetDetailResponseDto,
  PresetPageResponseDto,
  toPresetDetailResponse,
  toPresetPageResponse,
} from './preset-responses.dto.js';

@ApiTags('presets')
@UseGuards(AuthGuard)
@Controller('presets')
export class PresetsController {
  constructor(
    private readonly listPresetsUseCase: ListPresetsUseCase,
    private readonly getPresetUseCase: GetPresetUseCase,
    private readonly createPresetUseCase: CreatePresetUseCase,
    private readonly updatePresetUseCase: UpdatePresetUseCase,
    private readonly deletePresetUseCase: DeletePresetUseCase,
    private readonly importPresetUseCase: ImportPresetUseCase,
    private readonly exportPresetUseCase: ExportPresetUseCase,
    private readonly createPresetEntryUseCase: CreatePresetEntryUseCase,
    private readonly updatePresetEntryUseCase: UpdatePresetEntryUseCase,
    private readonly deletePresetEntryUseCase: DeletePresetEntryUseCase,
    private readonly updatePresetPromptItemsUseCase: UpdatePresetPromptItemsUseCase,
  ) {}

  @Get()
  @ApiEnvelopeOkResponse({ type: PresetPageResponseDto })
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListPresetsQueryDto,
  ): Promise<PresetPageResponseDto> {
    return toPresetPageResponse(
      await this.listPresetsUseCase.execute({
        viewerUserId: request.authUser.id,
        ...query,
      }),
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<PresetDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toPresetDetailResponse(
        await this.getPresetUseCase.execute({ id, viewerUserId: request.authUser.id }),
      ),
    );
  }

  @Post()
  @ApiBody({ type: CreatePresetRequestDto })
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreatePresetRequestDto,
  ): Promise<PresetDetailResponseDto> {
    return toPresetDetailResponse(
      await this.createPresetUseCase.execute({
        ownerUserId: request.authUser.id,
        ...body,
      }),
    );
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePresetRequestDto })
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdatePresetRequestDto,
  ): Promise<PresetDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toPresetDetailResponse(
        await this.updatePresetUseCase.execute({
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
      await this.deletePresetUseCase.execute({ id, viewerUserId: request.authUser.id });
      return { ok: true };
    });
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async importPreset(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedPresetFile | undefined,
  ): Promise<PresetDetailResponseDto> {
    return this.withApplicationErrors(async () => {
      if (file === undefined) {
        throw new PresetApplicationError({
          reason: 'invalid-import-file',
          params: {
            field: 'file',
          },
        });
      }

      return toPresetDetailResponse(
        await this.importPresetUseCase.execute({
          ownerUserId: request.authUser.id,
          content: file.buffer,
        }),
      );
    });
  }

  @Get(':id/export/sillytavern')
  @HttpCode(200)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'SillyTavern compatible preset JSON.',
    schema: { type: 'object' },
  })
  async exportSillyTavern(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.withApplicationErrors(async () => {
      const exported = await this.exportPresetUseCase.execute({
        id,
        viewerUserId: request.authUser.id,
      });

      response.json(exported);
    });
  }

  @Post(':id/entries')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: CreatePresetEntryRequestDto })
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async createEntry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CreatePresetEntryRequestDto,
  ): Promise<PresetDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toPresetDetailResponse(
        await this.createPresetEntryUseCase.execute({
          presetId: id,
          viewerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Patch(':id/entries/:entryId')
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'entryId', type: String })
  @ApiBody({ type: UpdatePresetEntryRequestDto })
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async updateEntry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() body: UpdatePresetEntryRequestDto,
  ): Promise<PresetDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toPresetDetailResponse(
        await this.updatePresetEntryUseCase.execute({
          presetId: id,
          entryId,
          viewerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Delete(':id/entries/:entryId')
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'entryId', type: String })
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async deleteEntry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ): Promise<PresetDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toPresetDetailResponse(
        await this.deletePresetEntryUseCase.execute({
          presetId: id,
          entryId,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  @Put(':id/prompt-items')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePresetPromptItemsRequestDto })
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async updatePromptItems(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdatePresetPromptItemsRequestDto,
  ): Promise<PresetDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toPresetDetailResponse(
        await this.updatePresetPromptItemsUseCase.execute({
          presetId: id,
          viewerUserId: request.authUser.id,
          items: body.items,
        }),
      ),
    );
  }

  private async withApplicationErrors<TResult>(handler: () => Promise<TResult>): Promise<TResult> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof PresetApplicationError) {
        throw toApiFailure(error as PresetApplicationError<PresetApplicationErrorReason>);
      }

      throw error;
    }
  }
}

interface UploadedPresetFile {
  originalname: string;
  buffer: Buffer;
}
