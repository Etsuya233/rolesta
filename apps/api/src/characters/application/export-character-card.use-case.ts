import { UseCase } from '../../common/errors/index.js';
import { CharacterApplicationError } from './character-application-error.js';
import {
  type CharacterCardCodec,
  type CharacterCardExportVersion,
} from '../ports/character-card-codec.js';
import type { CharacterCardStore } from '../ports/character-card-store.js';
import { translateCharacterError } from './character-error.mapper.js';

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

  @UseCase(translateCharacterError)
  async execute(command: ExportCharacterCardCommand): Promise<object> {
    const card = await this.store.findVisibleById(command.id, command.viewerUserId);

    if (card === null) {
      throw new CharacterApplicationError({
        reason: 'not-found',
        params: { characterId: command.id },
      });
    }

    return this.codec.exportCard(card, { version: command.version ?? 'v3' });
  }
}
