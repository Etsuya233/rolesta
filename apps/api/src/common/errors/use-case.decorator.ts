export type UseCaseErrorMapper = (error: unknown) => unknown;

export function UseCase(errorMapper: UseCaseErrorMapper): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as
      ((this: unknown, ...args: unknown[]) => unknown) | undefined;

    if (typeof original !== 'function') {
      return descriptor;
    }

    descriptor.value = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      try {
        return await original.call(this, ...args);
      } catch (error) {
        throw errorMapper(error);
      }
    };

    return descriptor;
  };
}
