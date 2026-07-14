import { UseCase } from '../../common/errors/use-case.decorator.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import type { NormalizedCrop } from '../../files/ports/image-processor.js';
import type { UserAvatarAssignment } from '../ports/user-avatar-assignment.js';
import type { UserAvatarService } from '../ports/user-avatar-service.js';
import { UserAvatarApplicationError } from './user-avatar-application-error.js';
import { translateUserAvatarError } from './user-avatar-error.mapper.js';

export interface UserAvatarClock {
  nowMs(): number;
}

export class UploadUserAvatarUseCase {
  constructor(
    private readonly avatars: UserAvatarService,
    private readonly assignment: UserAvatarAssignment,
    private readonly clock: UserAvatarClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateUserAvatarError)
  async execute(input: {
    userId: string;
    fileName: string;
    content: Buffer;
    crop: NormalizedCrop;
  }): Promise<string> {
    const avatar = await this.avatars.createAvatar({
      ownerUserId: input.userId,
      fileName: input.fileName,
      content: input.content,
      crop: input.crop,
    });
    const replaced = await this.unitOfWork.run(() =>
      this.assignment.replace({
        userId: input.userId,
        resourceId: avatar.resourceId,
        nowMs: this.clock.nowMs(),
      }),
    );
    if (!replaced) {
      throw new UserAvatarApplicationError({
        reason: 'not-found',
        params: { userId: input.userId },
      });
    }
    return avatar.resourceId;
  }
}

export class DeleteUserAvatarUseCase {
  constructor(
    private readonly assignment: UserAvatarAssignment,
    private readonly clock: UserAvatarClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateUserAvatarError)
  async execute(userId: string): Promise<void> {
    const removed = await this.unitOfWork.run(() =>
      this.assignment.remove({
        userId,
        nowMs: this.clock.nowMs(),
      }),
    );
    if (!removed) {
      throw new UserAvatarApplicationError({
        reason: 'not-found',
        params: { userId },
      });
    }
  }
}
