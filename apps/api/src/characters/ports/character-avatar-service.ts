export const CHARACTER_AVATAR_SERVICE = Symbol('CharacterAvatarService');

export interface CharacterAvatarCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterAvatarService {
  createAvatar(input: {
    ownerUserId: string;
    fileName: string;
    content: Buffer;
    crop: CharacterAvatarCrop;
  }): Promise<{ resourceId: string }>;

  activate(resourceId: string, ownerUserId: string): Promise<void>;

  release(resourceId: string, ownerUserId: string, releasedAtMs: number): Promise<void>;
}
