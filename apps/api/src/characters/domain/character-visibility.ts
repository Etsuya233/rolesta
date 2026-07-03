export type CharacterVisibility = 'private' | 'public';

export function isCharacterVisibility(value: string): value is CharacterVisibility {
  return value === 'private' || value === 'public';
}
