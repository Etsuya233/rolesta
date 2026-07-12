import { Controller, Get, Headers, Param, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthenticateTokenUseCase } from '../../auth/application/authenticate-token.use-case.js';
import { readBearerToken } from '../../auth/http/bearer-token.js';
import {
  FileApplicationError,
  type FileApplicationErrorReason,
} from '../application/file-application-error.js';
import { ReadFileUseCase } from '../application/read-file.use-case.js';
import { toApiFailure } from './file-application-error.mapper.js';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly readFileUseCase: ReadFileUseCase,
    private readonly authenticateTokenUseCase: AuthenticateTokenUseCase,
  ) {}

  @Get(':fileId/content')
  @ApiParam({ name: 'fileId', type: String })
  @ApiOkResponse({
    description: 'Immutable file content.',
    content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
  })
  async read(
    @Req() request: Request,
    @Res() response: Response,
    @Param('fileId') fileId: string,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
  ): Promise<void> {
    try {
      const token = readBearerToken(request);
      const viewer = token ? await this.authenticateTokenUseCase.execute(token) : null;
      const file = await this.readFileUseCase.execute(fileId, viewer?.id ?? null);

      response.setHeader('ETag', file.etag);
      response.setHeader('Content-Type', file.mediaType);
      response.setHeader('Content-Length', file.byteSize);
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader(
        'Cache-Control',
        file.visibility === 'public'
          ? 'public, max-age=31536000, immutable'
          : 'private, no-store',
      );

      if (ifNoneMatch === file.etag) {
        file.stream.destroy();
        response.status(304).end();
        return;
      }

      file.stream.pipe(response);
    } catch (error) {
      if (error instanceof FileApplicationError) {
        throw toApiFailure(error as FileApplicationError<FileApplicationErrorReason>);
      }

      throw error;
    }
  }
}
