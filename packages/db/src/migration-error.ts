export function toMigrationError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Database migration failed.', { cause: error });
}
