import { CharacterApplicationError } from './character-application-error.js';
import type { CharacterCardStore } from './character-card-store.js';
import {
  toSillyTavernCharacterCard,
  type SillyTavernCharacterCardOutput,
  type SillyTavernExportVersion,
} from '../infrastructure/silly-tavern-character-card.mapper.js';

export interface ExportCharacterCardCommand {
  id: string;
  viewerUserId: string;
  version?: SillyTavernExportVersion;
}

export class ExportCharacterCardUseCase {
  constructor(private readonly store: CharacterCardStore) {}

  async execute(command: ExportCharacterCardCommand): Promise<SillyTavernCharacterCardOutput> {
    const card = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (card === null) {
      throw new CharacterApplicationError('not-found');
    }

    return toSillyTavernCharacterCard(card, command.version ?? 'v3');
  }
}
