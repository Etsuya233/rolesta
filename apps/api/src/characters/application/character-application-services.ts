export interface CharacterClock {
  now(): Date;
}

export interface CharacterIdGenerator {
  createId(): string;
}
