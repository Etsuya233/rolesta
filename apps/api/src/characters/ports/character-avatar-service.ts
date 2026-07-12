import type { NormalizedCrop } from '../../files/ports/image-processor.js';

export const CHARACTER_AVATAR_SERVICE = Symbol('CharacterAvatarService');

export interface CharacterAvatarService {
  createAvatar(input: {
    ownerUserId: string;
    fileName: string;
    content: Buffer;
    crop: NormalizedCrop;
  }): Promise<{ resourceId: string }>;
}
