import { RolestaError, type RolestaErrorOptions } from './rolesta-error.js';

export abstract class ApplicationError<
  R extends string,
  P extends Record<string, unknown> = Record<string, never>,
> extends RolestaError<R, P> {
  protected constructor(options: RolestaErrorOptions<R, P>) {
    super(options);
  }
}
