import type { Prisma } from '@prisma/client';

import type { Profile } from '../../domain/entities/Profile.js';
import type { User } from '../../domain/entities/User.js';
import type { CreateUserInput, UserRepository } from '../../domain/repositories/UserRepository.js';
import { prisma } from '../db/prismaClient.js';

const mapUser = (user: Prisma.UserGetPayload<object>): User => ({
  id: user.id,
  telegramId: user.telegramId,
  phone: user.phone,
  username: user.username,
  passwordHash: user.passwordHash,
  createdAt: user.createdAt
});

const mapProfile = (profile: Prisma.ProfileGetPayload<object>): Profile => ({
  id: profile.id,
  userId: profile.userId,
  bio: profile.bio,
  avatarUrl: profile.avatarUrl,
  metadata: (profile.metadata as Record<string, unknown> | null) ?? null,
  usernameOverride: profile.usernameOverride,
  avatarOverride: profile.avatarOverride,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt
});

export class PrismaUserRepository implements UserRepository {
  async findById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? mapUser(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { username } });
    return user ? mapUser(user) : null;
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    return user ? mapUser(user) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = await prisma.user.create({
      data: {
        telegramId: input.telegramId,
        phone: input.phone,
        username: input.username,
        passwordHash: input.passwordHash
      }
    });

    await prisma.profile.create({
      data: {
        userId: user.id
      }
    });

    return mapUser(user);
  }

  async updateTelegramFields(userId: string, telegramId: string, username: string, phone?: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId,
        username,
        phone
      }
    });
    return mapUser(user);
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    return profile ? mapProfile(profile) : null;
  }

  async upsertProfile(userId: string, profile: Partial<Profile>): Promise<Profile> {
    const result = await prisma.profile.upsert({
      where: { userId },
      update: {
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        metadata: profile.metadata,
        usernameOverride: profile.usernameOverride,
        avatarOverride: profile.avatarOverride
      },
      create: {
        userId,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        metadata: profile.metadata,
        usernameOverride: profile.usernameOverride,
        avatarOverride: profile.avatarOverride
      }
    });

    return mapProfile(result);
  }
}
