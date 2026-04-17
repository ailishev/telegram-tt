import { Router } from 'express';

import { AuthController } from '../controllers/AuthController.js';
import { UserController } from '../controllers/UserController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { JwtService } from '../../../infrastructure/security/JwtService.js';

export const createRouter = (controllers: { auth: AuthController; user: UserController }, jwtService: JwtService): Router => {
  const router = Router();

  router.post('/auth/local/register', rateLimiter(), controllers.auth.registerLocal);
  router.post('/auth/local', rateLimiter(), controllers.auth.loginLocal);
  router.post('/auth/telegram', rateLimiter(), controllers.auth.loginTelegram);

  router.get('/me', authMiddleware(jwtService), controllers.user.me);
  router.patch('/profile', authMiddleware(jwtService), controllers.user.patchProfile);
  router.get('/profile/:id', authMiddleware(jwtService), controllers.user.getProfile);

  return router;
};
