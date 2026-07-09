import { CharacterApplicationError } from './character-application-error.js';
import {
  type CharacterCardCodec,
  type CharacterCardExportVersion,
} from '../ports/character-card-codec.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';

export interface ExportCharacterCardCommand {
  id: string;
  viewerUserId: string;
  version?: CharacterCardExportVersion;
}

export class ExportCharacterCardUseCase {
  constructor(
    private readonly store: CharacterCardStore,
    private readonly codec: CharacterCardCodec,
  ) {}

  async execute(command: ExportCharacterCardCommand): Promise<object> {
    const card = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (card === null) {
      throw new CharacterApplicationError('not-found');
    }

    return this.codec.exportCard(card, { version: command.version ?? 'v3' });
  }
}
