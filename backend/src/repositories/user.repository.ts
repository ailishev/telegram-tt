import { prisma } from '../lib/prisma.js';

export const userRepository = {
  findById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } });
  },
  findByIdentity(identity: string) {
    return prisma.user.findFirst({
      where: {
        OR: [{ username: identity }, { email: identity }],
      },
    });
  },
  create(data: { username: string; email?: string; phone?: string; passwordHash: string }) {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        profile: { create: {} },
      },
    });
  },
  updateProfile(userId: string, data: { avatar?: string; bio?: string; displayName?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        avatar: data.avatar,
        bio: data.bio,
        profile: {
          upsert: {
            create: { displayName: data.displayName },
            update: { displayName: data.displayName },
          },
        },
      },
      include: { profile: true },
    });
  },
};
