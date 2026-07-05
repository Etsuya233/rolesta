export interface PresetClock {
  now(): Date;
}

export interface PresetIdGenerator {
  createId(): string;
}
