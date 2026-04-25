import { Router } from 'express';

import { usersController } from '../../controllers/users.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const usersRoutes = Router();

usersRoutes.get('/:id', requireAuth, usersController.getById);
