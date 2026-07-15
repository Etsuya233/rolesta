export interface ChatClock {
  now(): Date;
}

export interface ChatIdGenerator {
  createId(): string;
}
