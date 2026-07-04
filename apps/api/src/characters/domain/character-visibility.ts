export const CHARACTER_VISIBILITIES = ['private', 'public'] as const;
export type CharacterVisibility = (typeof CHARACTER_VISIBILITIES)[number];

export function isCharacterVisibility(value: string): value is CharacterVisibility {
  return CHARACTER_VISIBILITIES.includes(value as CharacterVisibility);
}
