import { Injectable } from '@nestjs/common';
import {
  CreateFileResourceUseCase,
  type NewFileObject,
} from '../../files/application/create-file-resource.use-case.js';
import { FileApplicationError } from '../../files/application/file-application-error.js';
import type { ImageProcessor, NormalizedCrop } from '../../files/ports/image-processor.js';
import { CharacterPortError } from '../ports/character-port-error.js';
import type { CharacterAvatarService } from '../ports/character-avatar-service.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EDGE = 8192;
const AVATAR_SIZES = [64, 128, 256] as const;

@Injectable()
export class FileCharacterAvatarService implements CharacterAvatarService {
  constructor(
    private readonly images: ImageProcessor,
    private readonly createFileResource: CreateFileResourceUseCase,
  ) {}

  async createAvatar(input: {
    ownerUserId: string;
    fileName: string;
    content: Buffer;
    crop: NormalizedCrop;
  }): Promise<{ resourceId: string }> {
    if (input.content.byteLength > MAX_FILE_SIZE) {
      throw new CharacterPortError({
        reason: 'invalid-avatar',
        params: { field: 'file', detail: 'File exceeds the 10 MB limit.' },
      });
    }

    if (!validCrop(input.crop)) {
      throw new CharacterPortError({
        reason: 'invalid-avatar',
        params: { field: 'crop', detail: 'Crop must be within the image bounds.' },
      });
    }

    try {
      const image = await this.images.inspect(input.content);
      if (image.width > MAX_EDGE || image.height > MAX_EDGE) {
        throw new CharacterPortError({
          reason: 'invalid-avatar',
          params: { field: 'file', detail: 'Image dimensions exceed 8192 px.' },
        });
      }

      const variants = await Promise.all(
        AVATAR_SIZES.map(async (size) => ({
          role: String(size),
          visibility: 'public' as const,
          mediaType: 'image/webp',
          content: await this.images.transform({
            content: input.content,
            crop: input.crop,
            width: size,
            height: size,
            format: 'webp',
            quality: 86,
          }),
          width: size,
          height: size,
        })),
      );
      const objects: NewFileObject[] = [
        {
          role: 'original',
          visibility: 'private',
          mediaType: image.mediaType,
          content: input.content,
          width: image.width,
          height: image.height,
          originalFileName: input.fileName,
        },
        ...variants,
      ];
      const created = await this.createFileResource.execute({
        ownerUserId: input.ownerUserId,
        purpose: 'character-avatar',
        objects,
      });
      return { resourceId: created.resource.id };
    } catch (error) {
      if (error instanceof CharacterPortError) {
        throw error;
      }

      if (error instanceof FileApplicationError) {
        throw new CharacterPortError({
          reason:
            error.reason === 'storage-unavailable'
              ? 'avatar-storage-unavailable'
              : 'invalid-avatar',
          params: error.params,
          cause: error,
        });
      }

      throw error;
    }
  }
}

function validCrop(crop: NormalizedCrop): boolean {
  return (
    crop.x >= 0 &&
    crop.y >= 0 &&
    crop.width > 0 &&
    crop.height > 0 &&
    crop.x + crop.width <= 1 &&
    crop.y + crop.height <= 1
  );
}
