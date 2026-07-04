import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import {
  CHARACTER_LIST_SCOPES,
  CHARACTER_SORT_KEYS,
  SORT_DIRECTIONS,
} from '../application/character-card-store.js';
import { CharacterApplicationError } from '../application/character-application-error.js';
import { CreateCharacterUseCase } from '../application/create-character.use-case.js';
import { DeleteCharacterUseCase } from '../application/delete-character.use-case.js';
import { ExportCharacterCardUseCase } from '../application/export-character-card.use-case.js';
import { GetCharacterUseCase } from '../application/get-character.use-case.js';
import { ImportCharacterCardUseCase } from '../application/import-character-card.use-case.js';
import { ListCharactersUseCase } from '../application/list-characters.use-case.js';
import { UpdateCharacterUseCase } from '../application/update-character.use-case.js';
import type { SillyTavernExportVersion } from '../infrastructure/silly-tavern-character-card.mapper.js';
import { toApiFailure } from './character-application-error.mapper.js';
import {
  CreateCharacterRequestDto,
  ListCharactersQueryDto,
  UpdateCharacterRequestDto,
} from './character-requests.dto.js';
import {
  CharacterDetailResponseDto,
  CharacterPageResponseDto,
  toCharacterDetailResponse,
  toCharacterPageResponse,
} from './character-responses.dto.js';

@ApiTags('characters')
@UseGuards(AuthGuard)
@Controller('characters')
export class CharactersController {
  constructor(
    private readonly listCharactersUseCase: ListCharactersUseCase,
    private readonly getCharacterUseCase: GetCharacterUseCase,
    private readonly createCharacterUseCase: CreateCharacterUseCase,
    private readonly updateCharacterUseCase: UpdateCharacterUseCase,
    private readonly deleteCharacterUseCase: DeleteCharacterUseCase,
    private readonly importCharacterCardUseCase: ImportCharacterCardUseCase,
    private readonly exportCharacterCardUseCase: ExportCharacterCardUseCase,
  ) {}

  @Get()
  @ApiQuery({ enum: CHARACTER_LIST_SCOPES, name: 'scope', required: false })
  @ApiQuery({
    enum: CHARACTER_SORT_KEYS,
    name: 'sort',
    required: false,
  })
  @ApiQuery({ enum: SORT_DIRECTIONS, name: 'direction', required: false })
  @ApiQuery({ minimum: 0, name: 'pageIndex', required: false, type: Number })
  @ApiQuery({ maximum: 100, minimum: 1, name: 'pageSize', required: false, type: Number })
  @ApiQuery({ maxLength: 255, name: 'q', required: false, type: String })
  @ApiEnvelopeOkResponse({ type: CharacterPageResponseDto })
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListCharactersQueryDto,
  ): Promise<CharacterPageResponseDto> {
    return toCharacterPageResponse(
      await this.listCharactersUseCase.execute({
        viewerUserId: request.authUser.id,
        ...query,
      }),
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: CharacterDetailResponseDto })
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<CharacterDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toCharacterDetailResponse(
        await this.getCharacterUseCase.execute({ id, viewerUserId: request.authUser.id }),
      ),
    );
  }

  @Post()
  @ApiBody({ type: CreateCharacterRequestDto })
  @ApiEnvelopeOkResponse({ type: CharacterDetailResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateCharacterRequestDto,
  ): Promise<CharacterDetailResponseDto> {
    return toCharacterDetailResponse(
      await this.createCharacterUseCase.execute({
        ownerUserId: request.authUser.id,
        ...body,
      }),
    );
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateCharacterRequestDto })
  @ApiEnvelopeOkResponse({ type: CharacterDetailResponseDto })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateCharacterRequestDto,
  ): Promise<CharacterDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      toCharacterDetailResponse(
        await this.updateCharacterUseCase.execute({
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
      await this.deleteCharacterUseCase.execute({ id, viewerUserId: request.authUser.id });
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
  @ApiEnvelopeOkResponse({ type: CharacterDetailResponseDto })
  async importCharacter(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: UploadedCharacterFile | undefined,
  ): Promise<CharacterDetailResponseDto> {
    return this.withApplicationErrors(async () => {
      if (file === undefined) {
        throw new CharacterApplicationError('invalid-import-file');
      }

      return toCharacterDetailResponse(
        await this.importCharacterCardUseCase.execute({
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
  @ApiQuery({ enum: ['v2', 'v3'], name: 'version', required: false })
  @ApiOkResponse({
    description: 'SillyTavern compatible character card JSON.',
    schema: { type: 'object' },
  })
  async exportSillyTavern(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('version') version: SillyTavernExportVersion | undefined,
    @Res() response: Response,
  ): Promise<void> {
    await this.withApplicationErrors(async () => {
      const exportVersion = characterCardExportVersion(version);
      const exported = await this.exportCharacterCardUseCase.execute({
        id,
        viewerUserId: request.authUser.id,
        version: exportVersion,
      });

      response.json(exported);
    });
  }

  private async withApplicationErrors<TResult>(handler: () => Promise<TResult>): Promise<TResult> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof CharacterApplicationError) {
        throw toApiFailure(error);
      }

      throw error;
    }
  }
}

function characterCardExportVersion(
  version: SillyTavernExportVersion | undefined,
): SillyTavernExportVersion {
  if (version === undefined || version === 'v2' || version === 'v3') {
    return version ?? 'v3';
  }

  throw new CharacterApplicationError('invalid-character-card');
}

interface UploadedCharacterFile {
  originalname: string;
  buffer: Buffer;
}
