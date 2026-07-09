import { CharacterApplicationError } from './character-application-error.js';
import {
  applyCharacterCardEditableFields,
  type CharacterCardEditableFields,
} from './character-card-editable-fields.js';
import type { CharacterClock } from './character-application-services.js';
import type { CharacterCard } from '../domain/character-card.js';
import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';

export interface UpdateCharacterCommand extends CharacterCardEditableFields {
  id: string;
  viewerUserId: string;
}

export class UpdateCharacterUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly clock: CharacterClock,
  ) {}

  async execute(command: UpdateCharacterCommand): Promise<CharacterCard> {
    const current = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (current === null) {
      throw new CharacterApplicationError('not-found');
    }

    if (current.ownerUserId !== command.viewerUserId) {
      throw new CharacterApplicationError('forbidden');
    }

    const updated = applyCharacterCardEditableFields(
      {
        ...current,
        updatedAtMs: ensureEpochMillis(this.clock.now().getTime()),
      },
      command,
    );

    await this.store.update(updated);

    return updated;
  }
}
