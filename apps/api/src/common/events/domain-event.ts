export interface DomainEvent<TType extends string = string> {
  readonly type: TType;
  readonly occurredAtMs: number;
}
