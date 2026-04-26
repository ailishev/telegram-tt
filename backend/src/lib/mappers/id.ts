export function toBigIntId(value: string | number | bigint | null | undefined, field: string): bigint {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${field} missing`);
  }
  try {
    return typeof value === 'bigint' ? value : BigInt(value);
  } catch {
    throw new Error(`${field} invalid`);
  }
}

export function bigIntToString(value: bigint | null | undefined, field: string): string {
  if (value === null || value === undefined) {
    throw new Error(`${field} missing`);
  }
  return value.toString();
}
