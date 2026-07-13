import type { GetPublicFileObjectsUseCase } from '../../files/application/get-public-file-objects.use-case.js';
import type { UserAvatarReader } from '../ports/user-avatar-reader.js';

export interface UserAvatarView {
  resourceId: string;
  objects: Array<{ id: string; role: string }>;
}

export class GetUserAvatarUseCase {
  constructor(
    private readonly avatars: UserAvatarReader,
    private readonly publicFiles: GetPublicFileObjectsUseCase,
  ) {}

  async execute(userId: string): Promise<UserAvatarView | null> {
    const resourceId = await this.avatars.avatarResourceId(userId);
    if (!resourceId) {
      return null;
    }

    const objects = await this.publicFiles.execute([resourceId]);
    return {
      resourceId,
      objects: (objects.get(resourceId) ?? []).map((object) => ({
        id: object.id,
        role: object.role,
      })),
    };
  }
}
