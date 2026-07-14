import type { NormalizedCrop } from '../../files/ports/image-processor.js';

export const CHARACTER_AVATAR_SERVICE = Symbol('CharacterAvatarService');

export interface CharacterAvatarService {
  createAvatar(input: {
    ownerUserId: string;
    fileName: string;
    content: Buffer;
    crop: NormalizedCrop;
  }): Promise<{ resourceId: string }>;

  activate(resourceId: string, ownerUserId: string): Promise<void>;

  release(resourceId: string, ownerUserId: string, releasedAtMs: number): Promise<void>;
}
