import type { CharacterCard } from '../domain/character-card.js';

export const CHARACTER_AVATAR_ASSIGNMENT = Symbol('CharacterAvatarAssignment');

export interface CharacterAvatarAssignment {
  replace(input: {
    characterId: string;
    ownerUserId: string;
    resourceId: string;
    nowMs: number;
  }): Promise<CharacterCard | null>;
  remove(input: { characterId: string; ownerUserId: string; nowMs: number }): Promise<CharacterCard | null>;
}
