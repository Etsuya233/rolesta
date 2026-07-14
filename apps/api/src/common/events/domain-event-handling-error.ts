export class DomainEventHandlingError extends Error {
  override readonly cause: unknown;

  constructor(
    readonly eventType: string,
    cause: unknown,
  ) {
    super(`Failed to handle domain event "${eventType}".`);
    this.name = 'DomainEventHandlingError';
    this.cause = cause;
  }
}
