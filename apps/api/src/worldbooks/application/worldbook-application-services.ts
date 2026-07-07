export interface WorldbookClock {
  now(): Date;
}

export interface WorldbookIdGenerator {
  createId(): string;
}
