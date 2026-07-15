export const CHARACTER_REFERENCE_ACCESS = Symbol("CharacterReferenceAccess");

export interface CharacterReferenceAccess {
  acquireVisible(
    characterId: string,
    viewerUserId: string,
  ): Promise<boolean>;
}
