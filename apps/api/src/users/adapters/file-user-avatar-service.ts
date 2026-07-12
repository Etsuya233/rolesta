import { Injectable } from '@nestjs/common';
import { CreateFileResourceUseCase, type NewFileObject } from '../../files/application/create-file-resource.use-case.js';
import { FileApplicationError } from '../../files/application/file-application-error.js';
import type { ImageProcessor, NormalizedCrop } from '../../files/ports/image-processor.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_EDGE = 8192;
const AVATAR_SIZES = [64, 128, 256] as const;

@Injectable()
export class FileUserAvatarService {
  constructor(private readonly images: ImageProcessor, private readonly createFiles: CreateFileResourceUseCase) {}

  async create(input: { ownerUserId: string; fileName: string; content: Buffer; crop: NormalizedCrop }): Promise<string> {
    if (input.content.byteLength > MAX_FILE_SIZE || !validCrop(input.crop)) throw new UserAvatarError('Invalid avatar upload.');
    try {
      const image = await this.images.inspect(input.content);
      if (image.width > MAX_EDGE || image.height > MAX_EDGE) throw new UserAvatarError('Image dimensions exceed 8192 px.');
      const variants = await Promise.all(AVATAR_SIZES.map(async (size) => ({
        role: String(size), visibility: 'public' as const, mediaType: 'image/webp',
        content: await this.images.transform({ content: input.content, crop: input.crop, width: size, height: size, format: 'webp', quality: 86 }),
        width: size, height: size,
      })));
      const objects: NewFileObject[] = [
        { role: 'original', visibility: 'private', mediaType: image.mediaType, content: input.content, width: image.width, height: image.height, originalFileName: input.fileName },
        ...variants,
      ];
      return (await this.createFiles.execute({ ownerUserId: input.ownerUserId, purpose: 'user-avatar', objects })).resource.id;
    } catch (error) {
      if (error instanceof UserAvatarError) throw error;
      if (error instanceof FileApplicationError) throw new UserAvatarError(error.reason === 'storage-unavailable' ? 'Avatar storage is unavailable.' : 'Invalid avatar image.', error);
      throw error;
    }
  }
}

export class UserAvatarError extends Error {
  constructor(message: string, cause?: unknown) { super(message, { cause }); }
}

function validCrop(crop: NormalizedCrop): boolean {
  return crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0 && crop.x + crop.width <= 1 && crop.y + crop.height <= 1;
}
