import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

function sanitizeBigInt<T>(value: T): T {
  if (typeof value === 'bigint') {
    return value.toString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeBigInt(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, sanitizeBigInt(nestedValue)]),
    ) as T;
  }

  return value;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data: sanitizeBigInt(data) }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function parseError(err: unknown) {
  if (err instanceof ZodError) {
    return fail(err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), 422);
  }
  if (err instanceof Error) return fail(err.message, 500);
  return fail('Internal server error', 500);
}
