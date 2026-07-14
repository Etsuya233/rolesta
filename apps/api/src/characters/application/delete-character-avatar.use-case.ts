import { UseCase } from '../../common/errors/use-case.decorator.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import type { CharacterClock } from './character-application-services.js';
import { CharacterApplicationError } from './character-application-error.js';
import { translateCharacterError } from './character-error.mapper.js';
import type { CharacterAvatarAssignment } from '../ports/character-avatar-assignment.js';

export class DeleteCharacterAvatarUseCase {
  constructor(
    private readonly assignment: CharacterAvatarAssignment,
    private readonly clock: CharacterClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateCharacterError)
  async execute(id: string, ownerUserId: string): Promise<void> {
    const updated = await this.unitOfWork.run(() =>
      this.assignment.remove({
        characterId: id,
        ownerUserId,
        nowMs: this.clock.now().getTime(),
      }),
    );
    if (!updated) {
      throw new CharacterApplicationError({
        reason: 'not-found',
        params: { characterId: id },
      });
    }
  }
}
