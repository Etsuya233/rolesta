export type CharacterApplicationErrorReason =
  | 'not-found'
  | 'forbidden'
  | 'invalid-import-file'
  | 'unsupported-character-card'
  | 'invalid-character-card';

export class CharacterApplicationError extends Error {
  constructor(readonly reason: CharacterApplicationErrorReason) {
    super(reason);
    this.name = 'CharacterApplicationError';
  }
}
