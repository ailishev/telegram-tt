import type { User } from '../../prisma/generated/client/index.js';

export type AuthenticatedUser = Pick<User, 'id' | 'username' | 'email' | 'phone'>;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
