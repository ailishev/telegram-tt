import type { User } from '@prisma/client';

import { ensureDate, ensureString } from './common';
import { bigIntToString } from './id';

export type UserDTO = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  lastSeen: string;
  isOnline: boolean;
};

export function toUserDTO(user: User): UserDTO {
  return {
    id: bigIntToString(user.id, 'user.id'),
    username: ensureString(user.username, 'user.username'),
    email: ensureString(user.email, 'user.email'),
    avatar: user.avatar || undefined,
    bio: user.bio || undefined,
    createdAt: ensureDate(user.createdAt, 'user.createdAt').toISOString(),
    lastSeen: ensureDate(user.lastSeen, 'user.lastSeen').toISOString(),
    isOnline: user.isOnline,
  };
}
