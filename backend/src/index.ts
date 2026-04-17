import express from 'express';

import { AuthService } from './application/services/AuthService.js';
import { ProfileService } from './application/services/ProfileService.js';
import { UserService } from './application/services/UserService.js';
import { env } from './infrastructure/config/env.js';
import { prisma } from './infrastructure/db/prismaClient.js';
import { logger } from './infrastructure/logging/logger.js';
import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository.js';
import { AesCryptoService } from './infrastructure/security/EncryptionService.js';
import { JwtService } from './infrastructure/security/JwtService.js';
import { PasswordService } from './infrastructure/security/PasswordService.js';
import { TelegramService } from './infrastructure/telegram/TelegramService.js';
import { AuthController } from './interfaces/http/controllers/AuthController.js';
import { UserController } from './interfaces/http/controllers/UserController.js';
import { errorHandler } from './interfaces/http/middleware/errorHandler.js';
import { createRouter } from './interfaces/http/routes/index.js';

const bootstrap = async (): Promise<void> => {
  const app = express();
  app.use(express.json());

  const users = new PrismaUserRepository();
  const jwt = new JwtService(env.JWT_SECRET);
  const password = new PasswordService();
  const telegram = new TelegramService();
  const crypto = new AesCryptoService(env.TELEGRAM_SESSION_ENCRYPTION_KEY);

  const authService = new AuthService(users, jwt, password, telegram, crypto);
  const userService = new UserService(users);
  const profileService = new ProfileService(users);

  const authController = new AuthController(authService);
  const userController = new UserController(userService, profileService);

  app.use('/api', createRouter({ auth: authController, user: userController }, jwt));
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Backend listening');
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

bootstrap().catch((error) => {
  logger.fatal({ error }, 'Failed to bootstrap backend');
  process.exit(1);
});
