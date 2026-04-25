import { Router } from 'express';

import { messagesController } from '../../controllers/messages.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const messagesRoutes = Router();

messagesRoutes.get('/', requireAuth, messagesController.getMessages);
messagesRoutes.post('/', requireAuth, messagesController.postMessage);
