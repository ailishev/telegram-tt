import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { userRepository } from '../repositories/user.repository.js';

const refreshExpiresMs = env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

type JwtPayload = { sub: string; username: string };

export const authService = {
  async register(input: { username: string; email?: string; phone?: string; password: string }) {
    const existing = await userRepository.findByIdentity(input.email || input.username);
    if (existing) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      username: input.username,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });

    return this.createSession(user.id, user.username);
  },

  async login(identity: string, password: string) {
    const user = await userRepository.findByIdentity(identity);
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error('Invalid credentials');

    return this.createSession(user.id, user.username);
  },

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  },

  async me(userId: string) {
    return userRepository.findById(userId);
  },

  async createSession(userId: string, username: string) {
    const accessToken = jwt.sign({ sub: userId, username }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ sub: userId, username, type: 'refresh' }, env.JWT_SECRET, {
      expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d`,
    });

    await prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    return { accessToken, refreshToken };
  },
};
