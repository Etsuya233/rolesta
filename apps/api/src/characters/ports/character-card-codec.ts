import type { CharacterCard } from '../domain/character-card.js';

export const CHARACTER_CARD_CODEC = Symbol('CharacterCardCodec');

export type CharacterCardExportVersion = 'v2' | 'v3';

export type ImportedCharacterCard = Omit<
  CharacterCard,
  | 'id'
  | 'ownerUserId'
  | 'avatarResourceId'
  | 'visibility'
  | 'createdAtMs'
  | 'updatedAtMs'
  | 'lastUsedAtMs'
  | 'usageCount'
>;

export interface ImportCharacterCardFile {
  fileName: string;
  content: Buffer;
}

export interface ExportCharacterCardOptions {
  version: CharacterCardExportVersion;
}

export interface CharacterCardCodec {
  importFile(file: ImportCharacterCardFile): ImportedCharacterCard;
  exportCard(card: CharacterCard, options: ExportCharacterCardOptions): object;
}
