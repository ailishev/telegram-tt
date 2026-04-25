import { Router } from 'express';

import { chatsController } from '../../controllers/chats.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const chatsRoutes = Router();

chatsRoutes.get('/', requireAuth, chatsController.getChats);
chatsRoutes.post('/', requireAuth, chatsController.createChat);
chatsRoutes.get('/:id', requireAuth, chatsController.getChat);
