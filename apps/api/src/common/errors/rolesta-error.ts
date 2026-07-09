export interface RolestaErrorOptions<R extends string, P extends Record<string, unknown>> {
  reason: R;
  params: P;
  cause?: unknown;
}

export abstract class RolestaError<
  R extends string,
  P extends Record<string, unknown> = Record<string, never>,
> extends Error {
  readonly reason: R;
  readonly params: P;

  protected constructor(options: RolestaErrorOptions<R, P>) {
    super(options.reason, { cause: options.cause });
    this.name = new.target.name;
    this.reason = options.reason;
    this.params = options.params;
  }
}
