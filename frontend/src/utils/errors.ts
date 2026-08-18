export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function rootErrorMessage(error: unknown): string {
  const message = errorMessage(error);
  const separator = message.lastIndexOf(": ");
  return separator === -1 ? message : message.slice(separator + 2);
}
