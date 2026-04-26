import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __backendPrisma__: PrismaClient | undefined;
}

export const prisma = global.__backendPrisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__backendPrisma__ = prisma;
}
