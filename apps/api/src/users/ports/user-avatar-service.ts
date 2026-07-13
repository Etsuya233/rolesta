import type { NormalizedCrop } from '../../files/ports/image-processor.js';

export const USER_AVATAR_SERVICE = Symbol('UserAvatarService');

export interface UserAvatarService {
  createAvatar(input: {
    ownerUserId: string;
    fileName: string;
    content: Buffer;
    crop: NormalizedCrop;
  }): Promise<{ resourceId: string }>;
}
