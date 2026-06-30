export function getFormErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'The request failed.';
}
