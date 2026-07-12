export const IMAGE_PROCESSOR = Symbol('ImageProcessor');

export interface ImageInfo {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
}

export interface NormalizedCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageTransformRequest {
  content: Buffer;
  crop: NormalizedCrop;
  width: number;
  height: number;
  format: 'webp';
  quality: number;
}

export interface ImageProcessor {
  inspect(content: Buffer): Promise<ImageInfo>;
  transform(request: ImageTransformRequest): Promise<Buffer>;
}
