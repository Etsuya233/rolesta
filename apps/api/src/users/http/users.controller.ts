import { Body, Controller, Delete, Get, Inject, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ERROR_CODES } from '@rolesta/shared';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { GetPublicFileObjectsUseCase } from '../../files/application/get-public-file-objects.use-case.js';
import { ApiFailure } from '../../http/api-failure.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import { UserAvatarError } from '../adapters/file-user-avatar-service.js';
import { DeleteUserAvatarUseCase, UploadUserAvatarUseCase } from '../application/user-avatar.use-cases.js';
import { USER_AVATAR_STORE, type UserAvatarStore } from '../ports/user-avatar-store.js';

class AvatarCropRequestDto {
  x!: number;
  y!: number;
  width!: number;
  height!: number;
}

class UserAvatarResponseDto {
  resourceId!: string;
  sources!: Record<string, string>;
}

@ApiTags('users')
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly uploadAvatar: UploadUserAvatarUseCase,
    private readonly deleteAvatar: DeleteUserAvatarUseCase,
    @Inject(USER_AVATAR_STORE) private readonly avatars: UserAvatarStore,
    private readonly publicFiles: GetPublicFileObjectsUseCase,
  ) {}

  @Get('me/avatar')
  @ApiEnvelopeOkResponse({ type: UserAvatarResponseDto })
  async getAvatar(@Req() request: AuthenticatedRequest): Promise<UserAvatarResponseDto | null> {
    return this.responseFor(request.authUser.id);
  }

  @Put('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file', 'x', 'y', 'width', 'height'], properties: { file: { type: 'string', format: 'binary' }, x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiEnvelopeOkResponse({ type: UserAvatarResponseDto })
  async upload(
    @Req() request: AuthenticatedRequest,
    @Body() crop: AvatarCropRequestDto,
    @UploadedFile() file: { originalname: string; buffer: Buffer } | undefined,
  ): Promise<UserAvatarResponseDto> {
    if (!file) throw invalidAvatarFailure('Missing uploaded file.');
    try {
      await this.uploadAvatar.execute({ userId: request.authUser.id, fileName: file.originalname, content: file.buffer, crop });
      return (await this.responseFor(request.authUser.id))!;
    } catch (error) {
      if (error instanceof UserAvatarError) throw invalidAvatarFailure(error.message);
      throw error;
    }
  }

  @Delete('me/avatar')
  @ApiEnvelopeOkResponse({ schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  async delete(@Req() request: AuthenticatedRequest): Promise<{ ok: true }> {
    await this.deleteAvatar.execute(request.authUser.id);
    return { ok: true };
  }

  private async responseFor(userId: string): Promise<UserAvatarResponseDto | null> {
    const resourceId = await this.avatars.avatarResourceId(userId);
    if (!resourceId) return null;
    const objects = await this.publicFiles.execute([resourceId]);
    const sources = Object.fromEntries((objects.get(resourceId) ?? []).map((object) => [object.role, `/api/files/${object.id}/content`]));
    return { resourceId, sources };
  }
}

function invalidAvatarFailure(detail: string): ApiFailure {
  return new ApiFailure({ status: 422, code: ERROR_CODES.VALIDATION_FAILED, params: { detail } });
}
