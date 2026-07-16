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
import { UpdatePresetDocumentUseCase } from '../application/update-preset-document.use-case.js';
import { UpdatePresetPromptItemsUseCase } from '../application/update-preset-prompt-items.use-case.js';
import { UpdatePresetUseCase } from '../application/update-preset.use-case.js';
import type {
  PresetContentSlot,
  PresetPromptItem,
  PresetPromptPlacement,
  PresetSystemPrompt,
} from '../domain/preset.js';
import { toApiFailure } from './preset-application-error.mapper.js';
import {
  CreatePresetEntryRequestDto,
  CreatePresetRequestDto,
  ListPresetsQueryDto,
  UpdatePresetEntryRequestDto,
  UpdatePresetDocumentRequestDto,
  UpdatePresetPromptItemsRequestDto,
  UpdatePresetRequestDto,
} from './preset-requests.dto.js';
import {
  PresetDetailResponseDto,
  PresetImportResponseDto,
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
    private readonly updatePresetDocumentUseCase: UpdatePresetDocumentUseCase,
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
        await this.getPresetUseCase.execute({
          id,
          viewerUserId: request.authUser.id,
        }),
        request.authUser.id,
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
      request.authUser.id,
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
        request.authUser.id,
      ),
    );
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePresetDocumentRequestDto })
  @ApiEnvelopeOkResponse({ type: PresetDetailResponseDto })
  async updateDocument(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdatePresetDocumentRequestDto,
  ): Promise<PresetDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toPresetDetailResponse(
        await this.updatePresetDocumentUseCase.execute({
          presetId: id,
          viewerUserId: request.authUser.id,
          visibility: body.visibility,
          name: body.name,
          modelProviderId: body.modelProviderId,
          modelSettings: body.modelSettings,
          entries: body.entries.map((entry) => ({
            id: entry.id,
            name: entry.name,
            role: entry.role,
            content: entry.content,
            placement: toPresetPlacement(entry.placement),
            generationTypes: entry.generationTypes,
          })),
          promptItems: body.promptItems.map(toPresetPromptItem),
        }),
        request.authUser.id,
      ),
    );
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({
    schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
  })
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    return this.withApplicationErrors(async () => {
      await this.deletePresetUseCase.execute({
        id,
        viewerUserId: request.authUser.id,
      });
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
  @ApiEnvelopeOkResponse({ type: PresetImportResponseDto })
  async importPreset(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedPresetFile | undefined,
  ): Promise<PresetImportResponseDto> {
    return this.withApplicationErrors(async () => {
      if (file === undefined) {
        throw new PresetApplicationError({
          reason: 'invalid-import-file',
          params: {
            field: 'file',
          },
        });
      }

      const result = await this.importPresetUseCase.execute({
        ownerUserId: request.authUser.id,
        content: file.buffer,
      });
      return {
        preset: toPresetDetailResponse(result.preset, request.authUser.id),
        issues: result.issues,
        supplementedItems: result.supplementedItems,
      };
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
          name: body.name,
          role: body.role,
          placement: toPresetPlacement(body.placement),
          generationTypes: body.generationTypes,
          content: body.content,
        }),
        request.authUser.id,
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
          ...(body.name === undefined ? {} : { name: body.name }),
          ...(body.role === undefined ? {} : { role: body.role }),
          ...(body.placement === undefined ? {} : { placement: toPresetPlacement(body.placement) }),
          ...(body.generationTypes === undefined ? {} : { generationTypes: body.generationTypes }),
          ...(body.content === undefined ? {} : { content: body.content }),
        }),
        request.authUser.id,
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
        request.authUser.id,
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
        request.authUser.id,
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

function toPresetPlacement(input: {
  kind: 'relative' | 'inChat';
  depth?: number;
  order?: number;
}): PresetPromptPlacement {
  return input.kind === 'relative'
    ? { kind: 'relative' }
    : { kind: 'inChat', depth: input.depth!, order: input.order! };
}

function toPresetPromptItem(input: {
  id: string;
  kind: 'slot' | 'systemPrompt' | 'customPrompt';
  enabled: boolean;
  slot?: string;
  systemPrompt?: string;
  name?: string;
  role?: 'system' | 'user' | 'assistant';
  placement?: { kind: 'relative' | 'inChat'; depth?: number; order?: number };
  generationTypes?: Array<'normal' | 'continue' | 'impersonate' | 'swipe' | 'regenerate' | 'quiet'>;
  content?: string;
  allowCharacterOverride?: boolean;
  entryId?: string;
}): PresetPromptItem {
  const base = { id: input.id, enabled: input.enabled, orderIndex: 0 };
  if (input.kind === 'customPrompt') {
    return { ...base, kind: input.kind, entryId: input.entryId! };
  }
  if (input.kind === 'systemPrompt') {
    const systemPrompt = input.systemPrompt! as PresetSystemPrompt;
    const item = {
      ...base,
      kind: input.kind,
      systemPrompt,
      name: input.name!,
      role: input.role!,
      content: input.content!,
      placement: toPresetPlacement(input.placement!),
      generationTypes: input.generationTypes!,
      tokenCount: 0,
    };
    return systemPrompt === 'mainPrompt' || systemPrompt === 'postHistoryInstructions'
      ? { ...item, allowCharacterOverride: input.allowCharacterOverride! }
      : item;
  }
  const slot = input.slot!;
  if (slot === 'dialogueExamples' || slot === 'chatHistory') {
    return { ...base, kind: input.kind, slot };
  }
  return {
    ...base,
    kind: input.kind,
    slot: slot as PresetContentSlot,
    role: input.role!,
    placement: toPresetPlacement(input.placement!),
    generationTypes: input.generationTypes!,
  };
}
