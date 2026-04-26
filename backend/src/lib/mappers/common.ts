export function ensureString(value: string | null | undefined, field: string): string {
  if (!value) {
    throw new Error(`${field} is required`);
  }
  return value;
}

export function ensureDate(value: Date | null | undefined, field: string): Date {
  if (!value) {
    throw new Error(`${field} is required`);
  }
  return value;
}
