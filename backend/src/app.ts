import express from 'express';

import { authRoutes } from './modules/auth/routes.js';
import { chatsRoutes } from './modules/chats/routes.js';
import { messagesRoutes } from './modules/messages/routes.js';
import { profileRoutes } from './modules/profile/routes.js';
import { usersRoutes } from './modules/users/routes.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/healthz', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/profile', profileRoutes);
  app.use('/chats', chatsRoutes);
  app.use('/messages', messagesRoutes);

  return app;
}
