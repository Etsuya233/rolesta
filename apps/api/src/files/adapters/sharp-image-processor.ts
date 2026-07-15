import { Injectable } from '@nestjs/common';
import sharp, { type Metadata } from 'sharp';
import type { ImageInfo, ImageProcessor, ImageTransformRequest } from '../ports/image-processor.js';
import { FilePortError } from '../ports/file-port-error.js';

const MEDIA_TYPES = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

@Injectable()
export class SharpImageProcessor implements ImageProcessor {
  async inspect(content: Buffer): Promise<ImageInfo> {
    let metadata: Metadata;

    try {
      metadata = await sharp(content, { failOn: 'error', limitInputPixels: 40_000_000 }).metadata();
    } catch (cause) {
      throw new FilePortError({ reason: 'invalid-image', params: {}, cause });
    }

    if (!(metadata.format in MEDIA_TYPES) || (metadata.pages !== undefined && metadata.pages > 1)) {
      throw new FilePortError({
        reason: 'unsupported-image',
        params: { format: metadata.format ?? 'unknown' },
      });
    }

    if (metadata.width === undefined || metadata.height === undefined) {
      throw new FilePortError({ reason: 'invalid-image', params: {} });
    }

    return {
      mediaType: MEDIA_TYPES[metadata.format as keyof typeof MEDIA_TYPES],
      width: metadata.width,
      height: metadata.height,
    };
  }

  async transform(request: ImageTransformRequest): Promise<Buffer> {
    const info = await this.inspect(request.content);
    const crop = pixelCrop(info.width, info.height, request.crop);

    try {
      return await sharp(request.content, { failOn: 'error', limitInputPixels: 40_000_000 })
        .extract(crop)
        .resize(request.width, request.height, { fit: 'fill' })
        .webp({ quality: request.quality })
        .toBuffer();
    } catch (cause) {
      throw new FilePortError({ reason: 'invalid-image', params: {}, cause });
    }
  }
}

function pixelCrop(imageWidth: number, imageHeight: number, crop: ImageTransformRequest['crop']) {
  const left = Math.floor(crop.x * imageWidth);
  const top = Math.floor(crop.y * imageHeight);

  return {
    left,
    top,
    width: Math.min(imageWidth - left, Math.max(1, Math.round(crop.width * imageWidth))),
    height: Math.min(imageHeight - top, Math.max(1, Math.round(crop.height * imageHeight))),
  };
}
