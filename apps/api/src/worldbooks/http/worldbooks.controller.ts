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
import { CreateWorldbookEntryUseCase } from '../application/create-worldbook-entry.use-case.js';
import { CreateWorldbookUseCase } from '../application/create-worldbook.use-case.js';
import { DeleteWorldbookEntryUseCase } from '../application/delete-worldbook-entry.use-case.js';
import { DeleteWorldbookUseCase } from '../application/delete-worldbook.use-case.js';
import { ExportWorldbookUseCase } from '../application/export-worldbook.use-case.js';
import { GetWorldbookUseCase } from '../application/get-worldbook.use-case.js';
import { ImportWorldbookUseCase } from '../application/import-worldbook.use-case.js';
import { ListWorldbooksUseCase } from '../application/list-worldbooks.use-case.js';
import { UpdateWorldbookEntryOrderUseCase } from '../application/update-worldbook-entry-order.use-case.js';
import { UpdateWorldbookEntryUseCase } from '../application/update-worldbook-entry.use-case.js';
import { UpdateWorldbookDocumentUseCase } from '../application/update-worldbook-document.use-case.js';
import { UpdateWorldbookUseCase } from '../application/update-worldbook.use-case.js';
import {
  WorldbookApplicationError,
  type WorldbookApplicationErrorReason,
} from '../application/worldbook-application-error.js';
import { toApiFailure } from './worldbook-application-error.mapper.js';
import {
  CreateWorldbookEntryRequestDto,
  CreateWorldbookRequestDto,
  ListWorldbooksQueryDto,
  UpdateWorldbookEntryOrderRequestDto,
  UpdateWorldbookEntryRequestDto,
  UpdateWorldbookDocumentRequestDto,
  UpdateWorldbookRequestDto,
} from './worldbook-requests.dto.js';
import {
  toWorldbookDetailResponse,
  toWorldbookPageResponse,
  WorldbookDetailResponseDto,
  WorldbookPageResponseDto,
} from './worldbook-responses.dto.js';

@ApiTags('worldbooks')
@UseGuards(AuthGuard)
@Controller('worldbooks')
export class WorldbooksController {
  constructor(
    private readonly listWorldbooksUseCase: ListWorldbooksUseCase,
    private readonly getWorldbookUseCase: GetWorldbookUseCase,
    private readonly createWorldbookUseCase: CreateWorldbookUseCase,
    private readonly updateWorldbookUseCase: UpdateWorldbookUseCase,
    private readonly updateWorldbookDocumentUseCase: UpdateWorldbookDocumentUseCase,
    private readonly deleteWorldbookUseCase: DeleteWorldbookUseCase,
    private readonly importWorldbookUseCase: ImportWorldbookUseCase,
    private readonly exportWorldbookUseCase: ExportWorldbookUseCase,
    private readonly createWorldbookEntryUseCase: CreateWorldbookEntryUseCase,
    private readonly updateWorldbookEntryUseCase: UpdateWorldbookEntryUseCase,
    private readonly deleteWorldbookEntryUseCase: DeleteWorldbookEntryUseCase,
    private readonly updateWorldbookEntryOrderUseCase: UpdateWorldbookEntryOrderUseCase,
  ) {}

  @Get()
  @ApiEnvelopeOkResponse({ type: WorldbookPageResponseDto })
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListWorldbooksQueryDto,
  ): Promise<WorldbookPageResponseDto> {
    return toWorldbookPageResponse(
      await this.listWorldbooksUseCase.execute({
        viewerUserId: request.authUser.id,
        ...query,
      }),
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<WorldbookDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toWorldbookDetailResponse(
        await this.getWorldbookUseCase.execute({
          id,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  @Post()
  @ApiBody({ type: CreateWorldbookRequestDto })
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateWorldbookRequestDto,
  ): Promise<WorldbookDetailResponseDto> {
    return toWorldbookDetailResponse(
      await this.createWorldbookUseCase.execute({
        ownerUserId: request.authUser.id,
        ...body,
      }),
    );
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWorldbookRequestDto })
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateWorldbookRequestDto,
  ): Promise<WorldbookDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toWorldbookDetailResponse(
        await this.updateWorldbookUseCase.execute({
          id,
          viewerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWorldbookDocumentRequestDto })
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async updateDocument(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateWorldbookDocumentRequestDto,
  ): Promise<WorldbookDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toWorldbookDetailResponse(
        await this.updateWorldbookDocumentUseCase.execute({
          worldbookId: id,
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
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    return this.withApplicationErrors(async () => {
      await this.deleteWorldbookUseCase.execute({
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
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async importWorldbook(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedWorldbookFile | undefined,
  ): Promise<WorldbookDetailResponseDto> {
    return this.withApplicationErrors(async () => {
      if (file === undefined) {
        throw new WorldbookApplicationError({
          reason: 'invalid-import-file',
          params: { field: 'file' },
        });
      }

      return toWorldbookDetailResponse(
        await this.importWorldbookUseCase.execute({
          ownerUserId: request.authUser.id,
          fileName: file.originalname,
          content: file.buffer,
        }),
      );
    });
  }

  @Get(':id/export/sillytavern')
  @HttpCode(200)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'SillyTavern compatible world info JSON.',
    schema: { type: 'object' },
  })
  async exportSillyTavern(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.withApplicationErrors(async () => {
      const exported = await this.exportWorldbookUseCase.execute({
        id,
        viewerUserId: request.authUser.id,
      });

      response.json(exported);
    });
  }

  @Post(':id/entries')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: CreateWorldbookEntryRequestDto })
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async createEntry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CreateWorldbookEntryRequestDto,
  ): Promise<WorldbookDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toWorldbookDetailResponse(
        await this.createWorldbookEntryUseCase.execute({
          worldbookId: id,
          viewerUserId: request.authUser.id,
          ...body,
        }),
      ),
    );
  }

  @Patch(':id/entries/:entryId')
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'entryId', type: String })
  @ApiBody({ type: UpdateWorldbookEntryRequestDto })
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async updateEntry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() body: UpdateWorldbookEntryRequestDto,
  ): Promise<WorldbookDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toWorldbookDetailResponse(
        await this.updateWorldbookEntryUseCase.execute({
          worldbookId: id,
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
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async deleteEntry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ): Promise<WorldbookDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toWorldbookDetailResponse(
        await this.deleteWorldbookEntryUseCase.execute({
          worldbookId: id,
          entryId,
          viewerUserId: request.authUser.id,
        }),
      ),
    );
  }

  @Put(':id/entries/order')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWorldbookEntryOrderRequestDto })
  @ApiEnvelopeOkResponse({ type: WorldbookDetailResponseDto })
  async updateEntryOrder(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateWorldbookEntryOrderRequestDto,
  ): Promise<WorldbookDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toWorldbookDetailResponse(
        await this.updateWorldbookEntryOrderUseCase.execute({
          worldbookId: id,
          viewerUserId: request.authUser.id,
          entries: body.entries,
        }),
      ),
    );
  }

  private async withApplicationErrors<TResult>(handler: () => Promise<TResult>): Promise<TResult> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof WorldbookApplicationError) {
        throw toApiFailure(error as WorldbookApplicationError<WorldbookApplicationErrorReason>);
      }

      throw error;
    }
  }
}

interface UploadedWorldbookFile {
  originalname: string;
  buffer: Buffer;
}
