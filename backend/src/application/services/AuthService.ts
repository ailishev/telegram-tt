import { createHash } from 'node:crypto';

import { z } from 'zod';

import type { User } from '../../domain/entities/User.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { CryptoService } from '../../domain/services/CryptoService.js';
import type { TelegramGateway } from '../ports/TelegramGateway.js';
import { prisma } from '../../infrastructure/db/prismaClient.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { JwtService } from '../../infrastructure/security/JwtService.js';
import { PasswordService } from '../../infrastructure/security/PasswordService.js';

const localAuthSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8)
});

const telegramAuthSchema = z.object({
  phone: z.string().min(8),
  code: z.string().min(3)
});

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly telegramGateway: TelegramGateway,
    private readonly cryptoService: CryptoService
  ) {}

  async loginLocal(input: unknown): Promise<{ token: string; user: User }> {
    const parsed = localAuthSchema.parse(input);
    const user = await this.users.findByUsername(parsed.username);

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.passwordService.verify(parsed.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id });
    await this.persistSession(user.id, token);
    return { token, user };
  }

  async registerLocal(input: unknown): Promise<{ token: string; user: User }> {
    const parsed = localAuthSchema.parse(input);
    const passwordHash = await this.passwordService.hash(parsed.password);
    const user = await this.users.create({ username: parsed.username, passwordHash });
    const token = this.jwtService.sign({ sub: user.id });
    await this.persistSession(user.id, token);
    return { token, user };
  }

  async loginTelegram(input: unknown): Promise<{ token: string; user: User }> {
    const parsed = telegramAuthSchema.parse(input);
    const telegramProfile = await this.telegramGateway.loginWithPhoneCode(parsed.phone, parsed.code);

    let user = await this.users.findByTelegramId(telegramProfile.telegramUserId);
    if (!user) {
      user = await this.users.create({
        telegramId: telegramProfile.telegramUserId,
        username: telegramProfile.username ?? `tg_${telegramProfile.telegramUserId}`,
        phone: telegramProfile.phone ?? undefined
      });
    } else {
      user = await this.users.updateTelegramFields(
        user.id,
        telegramProfile.telegramUserId,
        telegramProfile.username ?? user.username,
        telegramProfile.phone ?? undefined
      );
    }

    await this.users.upsertProfile(user.id, {
      avatarUrl: telegramProfile.avatarUrl,
      metadata: {
        source: 'telegram',
        importedAt: new Date().toISOString()
      }
    });

    await prisma.telegramSession.upsert({
      where: {
        userId_telegramUserId: {
          userId: user.id,
          telegramUserId: telegramProfile.telegramUserId
        }
      },
      update: {
        encryptedSession: this.cryptoService.encrypt(telegramProfile.session),
        lastSyncedAt: new Date()
      },
      create: {
        userId: user.id,
        telegramUserId: telegramProfile.telegramUserId,
        encryptedSession: this.cryptoService.encrypt(telegramProfile.session)
      }
    });

    const token = this.jwtService.sign({ sub: user.id });
    await this.persistSession(user.id, token);
    return { token, user };
  }

  private async persistSession(userId: string, token: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
    logger.info({ userId }, 'Session persisted');
  }
}
