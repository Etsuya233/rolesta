import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/http/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/http/authenticated-request.js';
import { ApiEnvelopeOkResponse } from '../../openapi/api-envelope-response.decorator.js';
import {
  GetUserAvatarUseCase,
  type UserAvatarView,
} from '../application/get-user-avatar.use-case.js';
import {
  UserAvatarApplicationError,
  type UserAvatarApplicationErrorReason,
} from '../application/user-avatar-application-error.js';
import {
  DeleteUserAvatarUseCase,
  UploadUserAvatarUseCase,
} from '../application/user-avatar.use-cases.js';
import { toApiFailure } from './user-avatar-application-error.mapper.js';

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
    private readonly getUserAvatar: GetUserAvatarUseCase,
  ) {}

  @Get('me/avatar')
  @ApiEnvelopeOkResponse({ type: UserAvatarResponseDto })
  async getAvatar(@Req() request: AuthenticatedRequest): Promise<UserAvatarResponseDto | null> {
    return toAvatarResponse(await this.getUserAvatar.execute(request.authUser.id));
  }

  @Put('me/avatar')
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
  @ApiEnvelopeOkResponse({ type: UserAvatarResponseDto })
  async upload(
    @Req() request: AuthenticatedRequest,
    @Body() crop: AvatarCropRequestDto,
    @UploadedFile() file: { originalname: string; buffer: Buffer } | undefined,
  ): Promise<UserAvatarResponseDto> {
    return this.withApplicationErrors(async () => {
      if (!file) {
        throw new UserAvatarApplicationError({
          reason: 'invalid-avatar',
          params: { field: 'file', detail: 'Missing uploaded file.' },
        });
      }
      await this.uploadAvatar.execute({
        userId: request.authUser.id,
        fileName: file.originalname,
        content: file.buffer,
        crop,
      });
      const response = toAvatarResponse(await this.getUserAvatar.execute(request.authUser.id));
      if (!response) {
        throw new UserAvatarApplicationError({
          reason: 'avatar-assignment-conflict',
          params: { detail: 'Assigned avatar is unavailable.' },
        });
      }
      return response;
    });
  }

  @Delete('me/avatar')
  @ApiEnvelopeOkResponse({
    schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
  })
  async delete(@Req() request: AuthenticatedRequest): Promise<{ ok: true }> {
    return this.withApplicationErrors(async () => {
      await this.deleteAvatar.execute(request.authUser.id);
      return { ok: true };
    });
  }

  private async withApplicationErrors<TResult>(handler: () => Promise<TResult>): Promise<TResult> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof UserAvatarApplicationError) {
        throw toApiFailure(error as UserAvatarApplicationError<UserAvatarApplicationErrorReason>);
      }
      throw error;
    }
  }
}

function toAvatarResponse(view: UserAvatarView | null): UserAvatarResponseDto | null {
  if (!view) {
    return null;
  }
  return {
    resourceId: view.resourceId,
    sources: Object.fromEntries(
      view.objects.map((object) => [object.role, `/api/files/${object.id}/content`]),
    ),
  };
}
