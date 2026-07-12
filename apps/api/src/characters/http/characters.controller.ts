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
import { ApiBody, ApiConsumes, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetPublicFileObjectsUseCase } from '../../files/application/get-public-file-objects.use-case.js';
import type { Response } from 'express';
import type { CharacterCard } from '../domain/character-card.js';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import {
  CharacterApplicationError,
  type CharacterApplicationErrorReason,
} from '../application/character-application-error.js';
import { CreateCharacterUseCase } from '../application/create-character.use-case.js';
import { DeleteCharacterUseCase } from '../application/delete-character.use-case.js';
import { ExportCharacterCardUseCase } from '../application/export-character-card.use-case.js';
import { GetCharacterUseCase } from '../application/get-character.use-case.js';
import { ImportCharacterCardUseCase } from '../application/import-character-card.use-case.js';
import { ListCharactersUseCase } from '../application/list-characters.use-case.js';
import { UpdateCharacterUseCase } from '../application/update-character.use-case.js';
import { UploadCharacterAvatarUseCase } from '../application/upload-character-avatar.use-case.js';
import { DeleteCharacterAvatarUseCase } from '../application/delete-character-avatar.use-case.js';
import type { CharacterCardExportVersion } from '../ports/character-card-codec.js';
import { toApiFailure } from './character-application-error.mapper.js';
import {
  CreateCharacterRequestDto,
  AvatarCropRequestDto,
  ListCharactersQueryDto,
  UpdateCharacterRequestDto,
} from './character-requests.dto.js';
import {
  CharacterDetailResponseDto,
  CharacterPageResponseDto,
  type AvatarResourceResponseDto,
  avatarResponse,
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
    private readonly uploadCharacterAvatarUseCase: UploadCharacterAvatarUseCase,
    private readonly deleteCharacterAvatarUseCase: DeleteCharacterAvatarUseCase,
    private readonly publicFileObjects: GetPublicFileObjectsUseCase,
  ) {}

  @Get()
  @ApiEnvelopeOkResponse({ type: CharacterPageResponseDto })
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListCharactersQueryDto,
  ): Promise<CharacterPageResponseDto> {
    const page = await this.listCharactersUseCase.execute({
        viewerUserId: request.authUser.id,
        ...query,
      });
    return toCharacterPageResponse(page, await this.avatarResponses(page.items));
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ type: CharacterDetailResponseDto })
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<CharacterDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      this.toDetail(await this.getCharacterUseCase.execute({ id, viewerUserId: request.authUser.id })),
    );
  }

  @Post()
  @ApiBody({ type: CreateCharacterRequestDto })
  @ApiEnvelopeOkResponse({ type: CharacterDetailResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateCharacterRequestDto,
  ): Promise<CharacterDetailResponseDto> {
    return this.withApplicationErrors(async () =>
      this.toDetail(await this.createCharacterUseCase.execute({
          ownerUserId: request.authUser.id,
          ...body,
        })),
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
      this.toDetail(await this.updateCharacterUseCase.execute({
          id,
          viewerUserId: request.authUser.id,
          ...body,
        })),
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
        throw new CharacterApplicationError({
          reason: 'invalid-import-file',
          params: {
            field: 'file',
            detail: 'Missing uploaded file.',
          },
        });
      }

      return this.toDetail(await this.importCharacterCardUseCase.execute({
          ownerUserId: request.authUser.id,
          fileName: file.originalname,
          content: file.buffer,
        }));
    });
  }

  @Put(':id/avatar')
  @ApiParam({ name: 'id', type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'x', 'y', 'width', 'height'],
      properties: {
        file: { type: 'string', format: 'binary' },
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiEnvelopeOkResponse({ type: CharacterDetailResponseDto })
  async uploadAvatar(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() crop: AvatarCropRequestDto,
    @UploadedFile() file: UploadedCharacterFile | undefined,
  ): Promise<CharacterDetailResponseDto> {
    return this.withApplicationErrors(async () => {
      if (!file) {
        throw new CharacterApplicationError({
          reason: 'invalid-avatar',
          params: { field: 'file', detail: 'Missing uploaded file.' },
        });
      }
      return this.toDetail(
        await this.uploadCharacterAvatarUseCase.execute({
          id,
          ownerUserId: request.authUser.id,
          fileName: file.originalname,
          content: file.buffer,
          crop,
        }),
      );
    });
  }

  @Delete(':id/avatar')
  @ApiParam({ name: 'id', type: String })
  @ApiEnvelopeOkResponse({ schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  async deleteAvatar(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    return this.withApplicationErrors(async () => {
      await this.deleteCharacterAvatarUseCase.execute(id, request.authUser.id);
      return { ok: true };
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
    @Query('version') version: CharacterCardExportVersion | undefined,
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
        throw toApiFailure(error as CharacterApplicationError<CharacterApplicationErrorReason>);
      }

      throw error;
    }
  }

  private async toDetail(card: CharacterCard) {
    const avatars = await this.avatarResponses([card]);
    return toCharacterDetailResponse(card, avatars.get(card.id) ?? null);
  }

  private async avatarResponses(cards: CharacterCard[]) {
    const resources = cards
      .map((card) => card.avatarResourceId)
      .filter((id): id is string => id !== null);
    const objects = await this.publicFileObjects.execute(resources);
    const responses = new Map<string, AvatarResourceResponseDto>();
    for (const card of cards) {
      const avatar = avatarResponse(card.avatarResourceId, objects.get(card.avatarResourceId ?? ''));
      if (avatar) {
        responses.set(card.id, avatar);
      }
    }
    return responses;
  }
}

function characterCardExportVersion(
  version: CharacterCardExportVersion | undefined,
): CharacterCardExportVersion {
  if (version === undefined || version === 'v2' || version === 'v3') {
    return version ?? 'v3';
  }

  throw new CharacterApplicationError({
    reason: 'invalid-character-card',
    params: {
      field: 'version',
      value: version,
      detail: 'Unsupported character card export version.',
    },
  });
}

interface UploadedCharacterFile {
  originalname: string;
  buffer: Buffer;
}
