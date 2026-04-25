import { Router } from 'express';

import { profileController } from '../../controllers/profile.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const profileRoutes = Router();

profileRoutes.get('/', requireAuth, profileController.getProfile);
profileRoutes.patch('/', requireAuth, profileController.patchProfile);
