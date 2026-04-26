import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function parseError(err: unknown) {
  if (err instanceof ZodError) {
    return fail(err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), 422);
  }
  if (err instanceof Error) return fail(err.message, 500);
  return fail('Internal server error', 500);
}
