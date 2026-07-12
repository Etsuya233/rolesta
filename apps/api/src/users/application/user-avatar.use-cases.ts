import type { NormalizedCrop } from '../../files/ports/image-processor.js';
import type { FileUserAvatarService } from '../adapters/file-user-avatar-service.js';
import type { UserAvatarStore } from '../ports/user-avatar-store.js';

export class UploadUserAvatarUseCase {
  constructor(private readonly avatars: FileUserAvatarService, private readonly store: UserAvatarStore) {}

  async execute(input: { userId: string; fileName: string; content: Buffer; crop: NormalizedCrop }): Promise<string> {
    const resourceId = await this.avatars.create({ ownerUserId: input.userId, fileName: input.fileName, content: input.content, crop: input.crop });
    const replaced = await this.store.replaceAvatar(input.userId, resourceId, new Date().toISOString(), Date.now());
    if (!replaced) throw new UserAvatarNotFoundError();
    return resourceId;
  }
}

export class DeleteUserAvatarUseCase {
  constructor(private readonly store: UserAvatarStore) {}

  async execute(userId: string): Promise<void> {
    const replaced = await this.store.replaceAvatar(userId, null, new Date().toISOString(), Date.now());
    if (!replaced) throw new UserAvatarNotFoundError();
  }
}

export class UserAvatarNotFoundError extends Error {}
