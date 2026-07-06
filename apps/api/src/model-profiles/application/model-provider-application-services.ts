export interface ModelProviderIdGenerator {
  createId(): string;
}

export interface ModelProviderClock {
  now(): Date;
}
